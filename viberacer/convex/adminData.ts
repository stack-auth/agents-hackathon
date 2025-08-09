import { query } from "./_generated/server";

export const getAdminData = query({
  args: {},
  handler: async (ctx) => {
    // Get stage state
    const stageState = await ctx.db.query("stageState").first();
    
    // Get recent winners
    const recentWinners = await ctx.db
      .query("winners")
      .withIndex("by_timestamp")
      .order("desc")
      .take(5);
    
    // Get contest state (legacy skips)
    const contestStateRecords = await ctx.db.query("contestState").collect();
    
    // Calculate monitoring health
    const now = Date.now();
    let monitoringHealth = "Not Running";
    let lastCheckAgo = null;
    
    if (stageState) {
      const timeSinceLastCheck = (now - stageState.lastCheckedTime) / 1000;
      lastCheckAgo = Math.floor(timeSinceLastCheck);
      
      if (timeSinceLastCheck < 3) {
        monitoringHealth = "Healthy";
      } else if (timeSinceLastCheck < 10) {
        monitoringHealth = "Warning - Slow";
      } else {
        monitoringHealth = "Error - Stopped";
      }
    }
    
    // Calculate detailed timing info
    let nextStageTime = null;
    let timeToNext = 0;
    let nextStageAt = null;
    
    if (stageState) {
      nextStageTime = stageState.nextStageTime;
      timeToNext = Math.max(0, Math.floor((nextStageTime - now) / 1000));
      nextStageAt = new Date(nextStageTime).toLocaleTimeString();
    }
    
    // Get stage order for next stage display
    const stageOrder = [
      "in_progress",
      "judging_1",
      "judging_2",
      "judging_3",
      "break",
    ];
    
    const currentStage = stageState?.currentStage || "unknown";
    const currentIndex = stageOrder.indexOf(currentStage);
    const nextStage = currentIndex >= 0 ? stageOrder[(currentIndex + 1) % stageOrder.length] : "unknown";
    
    return {
      // Current state
      currentStage,
      nextStage,
      wasSkipped: stageState?.wasSkipped || false,
      
      // Timing
      timeToNext,
      nextStageAt,
      nextStageTimestamp: nextStageTime,
      
      // Monitoring health
      monitoringHealth,
      lastCheckAgo,
      lastCheckedTime: stageState?.lastCheckedTime,
      
      // Recent activity
      recentWinners: recentWinners.map(w => ({
        name: w.name,
        contestHour: w.contestHour || "unknown",
        timestamp: w.timestamp,
      })),
      
      // Legacy skip records (for debugging)
      activeSkips: contestStateRecords.length,
      
      // System info
      serverTime: new Date(now).toISOString(),
      serverTimeLocal: new Date(now).toLocaleTimeString(),
    };
  },
});