import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { CONTEST_CONFIG } from "./contestConfig";

type ContestStage = "in_progress" | "judging_1" | "judging_2" | "judging_3" | "break";

function getExpectedStage(): { stage: ContestStage; timeToNext: number } {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const { stages } = CONTEST_CONFIG;
  
  if (minutes >= stages.in_progress.startMinute) {
    // Contest in progress
    const timeToNext = (60 - minutes) * 60 - seconds;
    return { stage: "in_progress", timeToNext };
  } else if (minutes >= stages.judging_1.startMinute && minutes < stages.judging_2.startMinute) {
    // Judging stage 1
    const timeToNext = (stages.judging_2.startMinute - minutes) * 60 - seconds;
    return { stage: "judging_1", timeToNext };
  } else if (minutes >= stages.judging_2.startMinute && minutes < stages.judging_3.startMinute) {
    // Judging stage 2
    const timeToNext = (stages.judging_3.startMinute - minutes) * 60 - seconds;
    return { stage: "judging_2", timeToNext };
  } else if (minutes >= stages.judging_3.startMinute && minutes < stages.break.startMinute) {
    // Judging stage 3
    const timeToNext = (stages.break.startMinute - minutes) * 60 - seconds;
    return { stage: "judging_3", timeToNext };
  } else {
    // Break
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
      // Return the next stage in sequence, but keep the original timing
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
    const expected = getExpectedStage();
    
    // Trigger the end handler for the skipped stage
    await ctx.scheduler.runAfter(0, internal.stageHandlers.handleStageEnd, {
      stage: expected.stage,
      wasSkipped: true,
    });
    
    // Clear any existing skip record
    const existingRecord = await ctx.db.query("contestState").first();
    if (existingRecord) {
      await ctx.db.delete(existingRecord._id);
    }
    
    // Mark current stage as skipped
    await ctx.db.insert("contestState", {
      skippedStage: expected.stage,
      skippedAt: Date.now(),
    });
    
    // Return the stage we're skipping to
    const stageOrder: ContestStage[] = [
      "in_progress",
      "judging_1",
      "judging_2",
      "judging_3",
      "break",
    ];
    
    const currentIndex = stageOrder.indexOf(expected.stage);
    const nextIndex = (currentIndex + 1) % stageOrder.length;
    
    return { skippedTo: stageOrder[nextIndex] };
  },
});

export const clearSkips = mutation({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("contestState").collect();
    for (const record of records) {
      await ctx.db.delete(record._id);
    }
    return { cleared: records.length };
  },
});