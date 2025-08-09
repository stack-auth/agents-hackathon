import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getCurrentStageFromConfig } from "./contestConfig";

type ContestStage = "in_progress" | "judging_1" | "judging_2" | "judging_3" | "break";

export const checkStageTransitions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const currentStage = getCurrentStageFromConfig() as ContestStage;
    
    // Get the last tracked stage
    const tracker = await ctx.db.query("stageTracker").first();
    const lastStage = tracker?.currentStage;
    
    // If stage has changed, trigger the end handler for the previous stage
    if (lastStage && lastStage !== currentStage) {
      console.log(`Stage transition detected: ${lastStage} -> ${currentStage}`);
      
      // Trigger the end handler for the stage that just ended
      await ctx.scheduler.runAfter(0, internal.stageHandlers.handleStageEnd, {
        stage: lastStage,
        wasSkipped: false,
      });
      
      // Update the tracker
      if (tracker) {
        await ctx.db.patch(tracker._id, { 
          currentStage,
          lastTransition: Date.now(),
        });
      } else {
        await ctx.db.insert("stageTracker", {
          currentStage,
          lastTransition: Date.now(),
        });
      }
    } else if (!tracker) {
      // Initialize tracker if it doesn't exist
      await ctx.db.insert("stageTracker", {
        currentStage,
        lastTransition: Date.now(),
      });
    }
    
    // Schedule next check in 30 seconds
    await ctx.scheduler.runAfter(30000, internal.stageMonitor.checkStageTransitions);
  },
});

export const startMonitoring = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting stage transition monitoring");
    
    // Clear any existing tracker to start fresh
    const existingTrackers = await ctx.db.query("stageTracker").collect();
    for (const tracker of existingTrackers) {
      await ctx.db.delete(tracker._id);
    }
    
    // Initialize with current stage
    const currentStage = getCurrentStageFromConfig() as ContestStage;
    await ctx.db.insert("stageTracker", {
      currentStage,
      lastTransition: Date.now(),
    });
    
    // Start the monitoring loop
    await ctx.scheduler.runAfter(30000, internal.stageMonitor.checkStageTransitions);
    
    return { started: true, initialStage: currentStage };
  },
});