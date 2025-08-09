import { query } from "./_generated/server";
import { CONTEST_CONFIG, canJoinContest } from "./contestConfig";

export const getContestConfig = query({
  args: {},
  handler: async () => {
    return CONTEST_CONFIG;
  },
});

export const getJoinStatus = query({
  args: {},
  handler: async () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const { stages } = CONTEST_CONFIG;
    
    // Determine current stage
    let currentStage = "in_progress";
    if (minutes >= stages.in_progress.startMinute) {
      currentStage = "in_progress";
    } else if (minutes >= stages.judging_1.startMinute && minutes < stages.judging_2.startMinute) {
      currentStage = "judging_1";
    } else if (minutes >= stages.judging_2.startMinute && minutes < stages.judging_3.startMinute) {
      currentStage = "judging_2";
    } else if (minutes >= stages.judging_3.startMinute && minutes < stages.break.startMinute) {
      currentStage = "judging_3";
    } else {
      currentStage = "break";
    }
    
    return {
      canJoin: canJoinContest(currentStage),
      currentStage,
      currentMinute: minutes,
      joinWindowEnd: (stages.in_progress.startMinute + CONTEST_CONFIG.joinWindow.durationMinutes) % 60,
    };
  },
});