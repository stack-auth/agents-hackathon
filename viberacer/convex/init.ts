import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// This function runs on deployment to ensure monitoring is started
export const ensureMonitoringStarted = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if monitoring is already running
    const stageState = await ctx.db.query("stageState").first();
    
    if (!stageState) {
      console.log("[Init] Starting stage monitoring system...");
      // Start the monitoring system
      await ctx.scheduler.runAfter(0, internal.stageMonitor.checkAndUpdateStage);
      return { message: "Monitoring system started" };
    }
    
    // Check if monitoring needs to be restarted (if last check was > 5 seconds ago)
    const now = Date.now();
    const timeSinceLastCheck = (now - stageState.lastCheckedTime) / 1000;
    
    if (timeSinceLastCheck > 5) {
      console.log(`[Init] Restarting monitoring (last check was ${Math.floor(timeSinceLastCheck)}s ago)`);
      await ctx.scheduler.runAfter(0, internal.stageMonitor.checkAndUpdateStage);
      return { message: "Monitoring system restarted" };
    }
    
    return { message: "Monitoring system already running" };
  },
});