import { query, mutation } from "./_generated/server";

type ContestStage = "in_progress" | "judging_1" | "judging_2" | "judging_3" | "break";

function getExpectedStage(): { stage: ContestStage; timeToNext: number } {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  
  if (minutes >= 5) {
    // Contest in progress (5:00 - 59:59)
    const timeToNext = (60 - minutes) * 60 - seconds;
    return { stage: "in_progress", timeToNext };
  } else if (minutes === 0) {
    // Judging stage 1 (0:00 - 0:59)
    const timeToNext = 60 - seconds;
    return { stage: "judging_1", timeToNext };
  } else if (minutes === 1) {
    // Judging stage 2 (1:00 - 1:59)
    const timeToNext = 60 - seconds;
    return { stage: "judging_2", timeToNext };
  } else if (minutes === 2) {
    // Judging stage 3 (2:00 - 2:59)
    const timeToNext = 60 - seconds;
    return { stage: "judging_3", timeToNext };
  } else {
    // Break (3:00 - 4:59)
    const timeToNext = (5 - minutes) * 60 - seconds;
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