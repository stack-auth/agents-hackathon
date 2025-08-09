import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

type ContestStage = "in_progress" | "judging_1" | "judging_2" | "judging_3" | "break";

export const getCurrentContestState = query({
  args: {},
  handler: async (ctx) => {
    // Get stage state from the new monitoring system
    const stageState = await ctx.db.query("stageState").first();
    
    if (!stageState) {
      // System not initialized yet
      return {
        stage: "break" as ContestStage,
        timeToNext: 0,
        wasSkipped: false,
      };
    }
    
    // Calculate time to next stage
    const now = Date.now();
    const timeToNext = Math.max(0, Math.floor((stageState.nextStageTime - now) / 1000));
    
    return {
      stage: stageState.currentStage,
      timeToNext,
      wasSkipped: stageState.wasSkipped,
    };
  },
});

export const advanceStage = mutation({
  args: {},
  handler: async (ctx): Promise<{ from: string; to: string } | undefined> => {
    // Use the new manual advance from stageMonitor
    await ctx.scheduler.runAfter(0, internal.stageMonitor.manualAdvanceStage);
    // Return a simple response since we can't directly return the scheduler result
    return { from: "unknown", to: "unknown" };
  },
});

// Initialize the monitoring system on first load
export const initializeMonitoring = mutation({
  args: {},
  handler: async (ctx): Promise<{ started: boolean; message: string }> => {
    await ctx.scheduler.runAfter(0, internal.stageMonitor.startMonitoring);
    // Return a simple response since we can't directly return the scheduler result
    return { started: true, message: "Monitoring initialization scheduled" };
  },
});