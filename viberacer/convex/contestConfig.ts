/**
 * CONTEST CONFIGURATION
 * Edit this file to configure contest timing and rules
 */

export const CONTEST_CONFIG = {
  /**
   * STAGE SCHEDULE
   * Define when each stage runs (minute of the hour)
   * The duration is automatically calculated from the difference
   */
  stages: {
    // Contest runs from :05 to :00 (55 minutes)
    in_progress: {
      startMinute: 5,
      endMinute: 0, // 0 means top of next hour
    },
    
    // Judging stage 1 runs from :00 to :01 (1 minute)
    judging_1: {
      startMinute: 0,
      endMinute: 1,
    },
    
    // Judging stage 2 runs from :01 to :02 (1 minute)
    judging_2: {
      startMinute: 1,
      endMinute: 2,
    },
    
    // Judging stage 3 runs from :02 to :03 (1 minute)
    judging_3: {
      startMinute: 2,
      endMinute: 3,
    },
    
    // Break runs from :03 to :05 (2 minutes)
    break: {
      startMinute: 3,
      endMinute: 5,
    },
  },
  
  /**
   * JOIN WINDOW CONFIGURATION
   * How long after a contest starts can people still join?
   */
  joinWindow: {
    // Allow joining for the first 15 minutes after contest starts
    // (from minute 5 to minute 20)
    durationMinutes: 15,
    
    // Can always join during these stages (regardless of time)
    alwaysJoinableStages: ["judging_1", "judging_2", "judging_3", "break"],
  },
  
  /**
   * DISPLAY CONFIGURATION
   */
  display: {
    // Show "Contest started Xmin ago" when joinable during in_progress
    showContestAge: true,
    
    // Show countdown to next contest
    showNextContestCountdown: true,
  },
};

/**
 * Helper function to get current stage based on config
 */
export function getCurrentStageFromConfig(): string {
  const now = new Date();
  const currentMinute = now.getMinutes();
  
  const { stages } = CONTEST_CONFIG;
  
  // Check each stage to see if we're in it
  if (currentMinute >= stages.in_progress.startMinute || currentMinute < stages.judging_1.startMinute) {
    return "in_progress";
  } else if (currentMinute >= stages.judging_1.startMinute && currentMinute < stages.judging_2.startMinute) {
    return "judging_1";
  } else if (currentMinute >= stages.judging_2.startMinute && currentMinute < stages.judging_3.startMinute) {
    return "judging_2";
  } else if (currentMinute >= stages.judging_3.startMinute && currentMinute < stages.break.startMinute) {
    return "judging_3";
  } else {
    return "break";
  }
}

/**
 * Check if joining is allowed based on config
 */
export function canJoinContest(stage: string): boolean {
  const now = new Date();
  const currentMinute = now.getMinutes();
  const { joinWindow, stages } = CONTEST_CONFIG;
  
  // Check if we're in an always-joinable stage
  if (joinWindow.alwaysJoinableStages.includes(stage)) {
    return true;
  }
  
  // For in_progress stage, check if we're within the join window
  if (stage === "in_progress") {
    const contestStartMinute = stages.in_progress.startMinute;
    const joinEndMinute = (contestStartMinute + joinWindow.durationMinutes) % 60;
    
    // Handle wrap-around (e.g., if join window goes past the hour)
    if (joinEndMinute < contestStartMinute) {
      return currentMinute >= contestStartMinute || currentMinute < joinEndMinute;
    } else {
      return currentMinute >= contestStartMinute && currentMinute < joinEndMinute;
    }
  }
  
  return false;
}
