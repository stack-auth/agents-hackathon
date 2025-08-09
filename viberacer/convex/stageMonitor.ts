import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { CONTEST_CONFIG } from "./contestConfig";

type ContestStage = "in_progress" | "judging_1" | "judging_2" | "judging_3" | "break";

interface StageState {
  currentStage: ContestStage;
  nextStageTime: number; // Unix timestamp when next stage starts
  lastCheckedTime: number; // Unix timestamp of last check
  wasSkipped: boolean; // Whether current stage was manually skipped
}

// Calculate when the next stage should start based on current time and config
function calculateNextStageTime(currentStage: ContestStage, now: Date): number {
  const { stages } = CONTEST_CONFIG;
  
  // Determine the next stage in sequence
  const stageOrder: ContestStage[] = [
    "in_progress",
    "judging_1", 
    "judging_2",
    "judging_3",
    "break",
  ];
  
  const currentIndex = stageOrder.indexOf(currentStage);
  const nextStage = stageOrder[(currentIndex + 1) % stageOrder.length];
  
  // Get the start minute of the next stage
  let nextStageStartMinute: number;
  switch (nextStage) {
    case "in_progress":
      nextStageStartMinute = stages.in_progress.startMinute;
      break;
    case "judging_1":
      nextStageStartMinute = stages.judging_1.startMinute;
      break;
    case "judging_2":
      nextStageStartMinute = stages.judging_2.startMinute;
      break;
    case "judging_3":
      nextStageStartMinute = stages.judging_3.startMinute;
      break;
    case "break":
      nextStageStartMinute = stages.break.startMinute;
      break;
  }
  
  // Calculate time to next stage
  const currentMinutes = now.getMinutes();
  let minutesToAdd: number;
  if (nextStageStartMinute > currentMinutes) {
    // Next stage is later this hour
    minutesToAdd = nextStageStartMinute - currentMinutes;
  } else {
    // Next stage is next hour (wraps around)
    minutesToAdd = (60 - currentMinutes) + nextStageStartMinute;
  }
  
  // Create timestamp for next stage (zero out seconds)
  const nextTime = new Date(now);
  nextTime.setMinutes(nextTime.getMinutes() + minutesToAdd);
  nextTime.setSeconds(0);
  nextTime.setMilliseconds(0);
  
  return nextTime.getTime();
}

// Get expected stage based on current time
function getExpectedStageForTime(now: Date): ContestStage {
  const minutes = now.getMinutes();
  const { stages } = CONTEST_CONFIG;
  
  if (minutes >= stages.in_progress.startMinute && minutes < stages.judging_1.startMinute) {
    return "in_progress";
  } else if (minutes >= stages.judging_1.startMinute || minutes < stages.judging_2.startMinute) {
    // Handle wrap-around (e.g., 41-1)
    if (minutes >= stages.judging_1.startMinute) {
      return "judging_1";
    }
    if (minutes < stages.judging_2.startMinute) {
      return "judging_1";
    }
  }
  
  if (minutes >= stages.judging_2.startMinute && minutes < stages.judging_3.startMinute) {
    return "judging_2";
  } else if (minutes >= stages.judging_3.startMinute && minutes < stages.break.startMinute) {
    return "judging_3";
  } else if (minutes >= stages.break.startMinute && minutes < stages.in_progress.startMinute) {
    return "break";
  }
  
  // Default fallback
  return "break";
}

// Check and update stage if needed (called periodically)
export const checkAndUpdateStage = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const nowTimestamp = now.getTime();
    
    // Get current stage state
    let stageState = await ctx.db.query("stageState").first();
    
    // Initialize if doesn't exist
    if (!stageState) {
      const currentStage = getExpectedStageForTime(now);
      const nextStageTime = calculateNextStageTime(currentStage, now);
      
      const newState: StageState = {
        currentStage,
        nextStageTime,
        lastCheckedTime: nowTimestamp,
        wasSkipped: false,
      };
      
      await ctx.db.insert("stageState", newState);
      console.log(`[Stage Monitor] Initialized - Stage: ${currentStage}, Next transition: ${new Date(nextStageTime).toISOString()}`);
      
      // Schedule next check batch
      await scheduleNextChecks(ctx);
      return;
    }
    
    // Log current state (less verbose - only log every 10 seconds)
    const timeToNext = Math.max(0, Math.floor((stageState.nextStageTime - nowTimestamp) / 1000));
    if (nowTimestamp - stageState.lastCheckedTime > 9000) {
      console.log(`[Stage Check] Time: ${now.toISOString().split('T')[1].split('.')[0]}, Stage: ${stageState.currentStage}, Next in: ${timeToNext}s, Skipped: ${stageState.wasSkipped}`);
    }
    
    // Check if it's time to transition to next stage
    if (nowTimestamp >= stageState.nextStageTime && !stageState.wasSkipped) {
      // Trigger stage end handler for current stage
      await ctx.scheduler.runAfter(0, internal.stageHandlers.handleStageEnd, {
        stage: stageState.currentStage,
        wasSkipped: false,
      });
      
      // Calculate next stage
      const stageOrder: ContestStage[] = [
        "in_progress",
        "judging_1",
        "judging_2", 
        "judging_3",
        "break",
      ];
      
      const currentIndex = stageOrder.indexOf(stageState.currentStage);
      const nextStage = stageOrder[(currentIndex + 1) % stageOrder.length];
      const nextStageTime = calculateNextStageTime(nextStage, now);
      
      // Update stage state
      await ctx.db.patch(stageState._id, {
        currentStage: nextStage,
        nextStageTime,
        lastCheckedTime: nowTimestamp,
        wasSkipped: false,
      });
      
      console.log(`[Stage Transition] AUTO: ${stageState.currentStage} -> ${nextStage}, Next: ${new Date(nextStageTime).toISOString()}`);
    } else {
      // Just update last checked time
      await ctx.db.patch(stageState._id, {
        lastCheckedTime: nowTimestamp,
        wasSkipped: false, // Reset skip flag if time has caught up
      });
    }
    
    // Schedule next check batch
    await scheduleNextChecks(ctx);
  },
});

// Helper to schedule multiple checks to ensure continuity
async function scheduleNextChecks(ctx: any) {
  // Schedule multiple checks at different intervals to ensure at least one runs
  // This creates redundancy in case one fails
  await ctx.scheduler.runAfter(1000, internal.stageMonitor.checkAndUpdateStage);  // 1 second
  await ctx.scheduler.runAfter(5000, internal.stageMonitor.ensureMonitoring);      // 5 seconds (backup)
  await ctx.scheduler.runAfter(30000, internal.stageMonitor.ensureMonitoring);     // 30 seconds (deep backup)
}

// Ensure monitoring is running (can be called anytime to restart)
export const ensureMonitoring = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const stageState = await ctx.db.query("stageState").first();
    
    if (!stageState) {
      // Not initialized, start monitoring
      console.log("[Monitor Health] Starting monitoring - not initialized");
      await ctx.scheduler.runAfter(0, internal.stageMonitor.checkAndUpdateStage);
      return;
    }
    
    // Check if monitoring is stale (hasn't checked in last 10 seconds)
    const timeSinceLastCheck = (now - stageState.lastCheckedTime) / 1000;
    if (timeSinceLastCheck > 10) {
      console.log(`[Monitor Health] Restarting monitoring - last check was ${Math.floor(timeSinceLastCheck)}s ago`);
      await ctx.scheduler.runAfter(0, internal.stageMonitor.checkAndUpdateStage);
    }
  },
});

// Manual stage advance (from admin panel)
export const manualAdvanceStage = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const stageState = await ctx.db.query("stageState").first();
    
    if (!stageState) {
      throw new Error("Stage state not initialized");
    }
    
    // Trigger end handler for current stage
    await ctx.scheduler.runAfter(0, internal.stageHandlers.handleStageEnd, {
      stage: stageState.currentStage,
      wasSkipped: true,
    });
    
    // Calculate next stage
    const stageOrder: ContestStage[] = [
      "in_progress",
      "judging_1",
      "judging_2",
      "judging_3",
      "break",
    ];
    
    const currentIndex = stageOrder.indexOf(stageState.currentStage);
    const nextStage = stageOrder[(currentIndex + 1) % stageOrder.length];
    const nextStageTime = calculateNextStageTime(nextStage, now);
    
    // Update state
    await ctx.db.patch(stageState._id, {
      currentStage: nextStage,
      nextStageTime,
      lastCheckedTime: now.getTime(),
      wasSkipped: true,
    });
    
    console.log(`[Stage Advance] MANUAL: ${stageState.currentStage} -> ${nextStage}, Next: ${new Date(nextStageTime).toISOString()}`);
    
    return { from: stageState.currentStage, to: nextStage };
  },
});

// Start monitoring (call this once to begin the monitoring loop)
export const startMonitoring = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("[Stage Monitor] Starting monitoring system");
    
    // Check if already running
    const existing = await ctx.db.query("stageState").first();
    if (existing) {
      console.log("[Stage Monitor] Already running, skipping initialization");
      return { started: false, message: "Already running" };
    }
    
    // Start the monitoring loop
    await ctx.scheduler.runAfter(0, internal.stageMonitor.checkAndUpdateStage);
    
    return { started: true, message: "Monitoring started" };
  },
});