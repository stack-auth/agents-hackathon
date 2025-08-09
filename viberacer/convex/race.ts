import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

type RaceStage = "in_progress" | "judging_1" | "judging_2" | "judging_3" | "break";

function getExpectedStage(): { stage: RaceStage; timeToNext: number } {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  
  if (minutes >= 5) {
    // Race in progress (5:00 - 59:59)
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

export const getCurrentRaceState = query({
  args: {},
  handler: async (ctx) => {
    const currentState = await ctx.db.query("raceState").first();
    const expected = getExpectedStage();
    
    // If no state exists or manual override is not set, use time-based logic
    if (!currentState || !currentState.manualOverride) {
      // Return expected state based on time
      return {
        stage: expected.stage,
        timeToNext: expected.timeToNext,
        manualOverride: false,
      };
    }
    
    // Return manual override state
    return {
      stage: currentState.stage,
      timeToNext: null,
      manualOverride: true,
    };
  },
});

export const advanceStage = mutation({
  args: {},
  handler: async (ctx) => {
    const currentState = await ctx.db.query("raceState").first();
    
    const stageOrder: RaceStage[] = [
      "in_progress",
      "judging_1",
      "judging_2",
      "judging_3",
      "break",
    ];
    
    const currentIndex = currentState 
      ? stageOrder.indexOf(currentState.stage)
      : -1;
    
    const nextIndex = (currentIndex + 1) % stageOrder.length;
    const nextStage = stageOrder[nextIndex];
    
    if (currentState) {
      await ctx.db.delete(currentState._id);
    }
    
    await ctx.db.insert("raceState", {
      stage: nextStage,
      startedAt: Date.now(),
      manualOverride: true,
    });
    
    return { stage: nextStage };
  },
});

export const resetToAutomatic = mutation({
  args: {},
  handler: async (ctx) => {
    const currentState = await ctx.db.query("raceState").first();
    
    if (currentState) {
      await ctx.db.delete(currentState._id);
    }
    
    const expected = getExpectedStage();
    await ctx.db.insert("raceState", {
      stage: expected.stage,
      startedAt: Date.now(),
      manualOverride: false,
    });
    
    return { stage: expected.stage };
  },
});