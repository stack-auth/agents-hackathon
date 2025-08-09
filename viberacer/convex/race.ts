import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { CONTEST_CONFIG } from "./contestConfig";

type ContestStage = "in_progress" | "judging_1" | "judging_2" | "judging_3" | "break";

function getExpectedStage(): { stage: ContestStage; timeToNext: number } {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const { stages } = CONTEST_CONFIG;
  
  // Check each stage based on the configured start/end minutes
  if (minutes >= stages.in_progress.startMinute && minutes < stages.judging_1.startMinute) {
    // Contest in progress (e.g., 5-41)
    const timeToNext = (stages.judging_1.startMinute - minutes) * 60 - seconds;
    return { stage: "in_progress", timeToNext };
  } else if (minutes >= stages.judging_1.startMinute && minutes < stages.judging_1.endMinute) {
    // Judging stage 1 (e.g., 41-42 wraps to next hour)
    // Handle wrap-around to next hour
    const endMinute = stages.judging_1.endMinute || 60;
    const timeToNext = endMinute < stages.judging_1.startMinute 
      ? (60 - minutes + endMinute) * 60 - seconds  // Wraps to next hour
      : (endMinute - minutes) * 60 - seconds;
    return { stage: "judging_1", timeToNext };
  } else if (minutes >= stages.judging_2.startMinute && minutes < stages.judging_3.startMinute) {
    // Judging stage 2 (e.g., 1-2)
    const timeToNext = (stages.judging_3.startMinute - minutes) * 60 - seconds;
    return { stage: "judging_2", timeToNext };
  } else if (minutes >= stages.judging_3.startMinute && minutes < stages.break.startMinute) {
    // Judging stage 3 (e.g., 2-3)
    const timeToNext = (stages.break.startMinute - minutes) * 60 - seconds;
    return { stage: "judging_3", timeToNext };
  } else if (minutes >= stages.break.startMinute && minutes < stages.in_progress.startMinute) {
    // Break (e.g., 3-5)
    const timeToNext = (stages.in_progress.startMinute - minutes) * 60 - seconds;
    return { stage: "break", timeToNext };
  } else {
    // Special case: we're past minute 41 but before minute 60
    // This is judging_1 that wraps around the hour
    if (minutes >= stages.judging_1.startMinute) {
      const timeToNext = (60 - minutes + stages.judging_1.endMinute) * 60 - seconds;
      return { stage: "judging_1", timeToNext };
    }
    // Default to break if we can't determine
    const timeToNext = (stages.in_progress.startMinute - minutes) * 60 - seconds;
    return { stage: "break", timeToNext };
  }
}

export const getCurrentContestState = query({
  args: {},
  handler: async (ctx) => {
    const skipRecord = await ctx.db.query("contestState").first();
    const expected = getExpectedStage();
    
    // Check if current stage was skipped
    if (skipRecord?.skippedStage === expected.stage) {
      // If we have a specific skippedTo stage, use that
      if (skipRecord.skippedTo) {
        return {
          stage: skipRecord.skippedTo,
          timeToNext: expected.timeToNext,
          wasSkipped: true,
        };
      }
      
      // Otherwise, return the next stage in sequence
      const stageOrder: ContestStage[] = [
        "in_progress",
        "judging_1",
        "judging_2",
        "judging_3",
        "break",
      ];
      
      const currentIndex = stageOrder.indexOf(expected.stage);
      const nextIndex = (currentIndex + 1) % stageOrder.length;
      const nextStage = stageOrder[nextIndex];
      
      return {
        stage: nextStage,
        timeToNext: expected.timeToNext,
        wasSkipped: true,
      };
    }
    
    return {
      stage: expected.stage,
      timeToNext: expected.timeToNext,
      wasSkipped: false,
    };
  },
});

export const advanceStage = mutation({
  args: {},
  handler: async (ctx) => {
    // Get the current actual stage (considering skips)
    const skipRecord = await ctx.db.query("contestState").first();
    const expected = getExpectedStage();
    
    let currentStage = expected.stage;
    
    // If there's already a skip, we need to figure out what stage we're actually showing
    if (skipRecord?.skippedStage === expected.stage) {
      // If we have a skippedTo field, that's our current stage
      if (skipRecord.skippedTo) {
        currentStage = skipRecord.skippedTo;
      } else {
        const stageOrder: ContestStage[] = [
          "in_progress",
          "judging_1",
          "judging_2",
          "judging_3",
          "break",
        ];
        const skippedIndex = stageOrder.indexOf(skipRecord.skippedStage);
        const currentIndex = (skippedIndex + 1) % stageOrder.length;
        currentStage = stageOrder[currentIndex];
      }
    }
    
    // Trigger the end handler for the current stage
    await ctx.scheduler.runAfter(0, internal.stageHandlers.handleStageEnd, {
      stage: currentStage,
      wasSkipped: true,
    });
    
    // Clear any existing skip record
    if (skipRecord) {
      await ctx.db.delete(skipRecord._id);
    }
    
    // Determine the next stage
    const stageOrder: ContestStage[] = [
      "in_progress",
      "judging_1",
      "judging_2",
      "judging_3",
      "break",
    ];
    
    const currentIdx = stageOrder.indexOf(currentStage);
    const nextIdx = (currentIdx + 1) % stageOrder.length;
    const nextStage = stageOrder[nextIdx];
    
    // If the next stage is still within the same time period, we need a double skip
    // (e.g., if we're showing judging_1 but time says in_progress, and we advance to judging_2)
    if (nextStage !== expected.stage && expected.stage !== currentStage) {
      // Store a double skip - we're skipping from expected to a stage beyond current
      await ctx.db.insert("contestState", {
        skippedStage: expected.stage,
        skippedTo: nextStage,
        skippedAt: Date.now(),
      });
    } else if (nextStage !== expected.stage) {
      // Normal skip
      await ctx.db.insert("contestState", {
        skippedStage: expected.stage,
        skippedAt: Date.now(),
      });
    }
    
    // Update stage tracker
    const tracker = await ctx.db.query("stageTracker").first();
    if (tracker) {
      await ctx.db.patch(tracker._id, {
        currentStage: nextStage,
        lastTransition: Date.now(),
      });
    } else {
      await ctx.db.insert("stageTracker", {
        currentStage: nextStage,
        lastTransition: Date.now(),
      });
    }
    
    console.log(`Advanced from ${currentStage} to ${nextStage} (time says ${expected.stage})`);
    
    return { from: currentStage, to: nextStage, timeStage: expected.stage };
  },
});

export const clearSkips = mutation({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("contestState").collect();
    for (const record of records) {
      await ctx.db.delete(record._id);
    }
    
    // Also reset the stage tracker to current actual stage
    const expected = getExpectedStage();
    const tracker = await ctx.db.query("stageTracker").first();
    if (tracker) {
      await ctx.db.patch(tracker._id, {
        currentStage: expected.stage,
        lastTransition: Date.now(),
      });
    }
    
    return { cleared: records.length, resetTo: expected.stage };
  },
});