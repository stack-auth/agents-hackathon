import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { 
  prepareContestForJudging,
  getCurrentContestId 
} from "./contestHelpers";

type ContestStage = "in_progress" | "judging_1" | "judging_2" | "judging_3" | "break";

// KEEP THIS FILE CLEAN. KEEP OPERATIONS THAT CAN BE EXTRACTED INTO FUNCTIONS IN OTHER FILES, AND USE THEM HERE. IT SHOULD BE EASY TO READ AND UNDERSTAND THIS FILE.

/**
 * Stage transition handlers - called when a stage ends
 * Edit this file to add custom logic when stages complete
 */
const stageEndHandlers: Record<ContestStage, (ctx: any) => Promise<void>> = {
  // Called when contest ends (at :41)
  in_progress: async (ctx) => {
    const contestId = getCurrentContestId();
    console.log(`Contest ${contestId} ended, starting judging phase`);
        
    // Prepare for judging
    const submissions = await prepareContestForJudging(ctx.db);
    console.log(`${submissions.length} submissions ready for judging`);
  },

  // Called when judging stage 1 ends (at :01)
  judging_1: async (ctx) => {
    console.log("Judging stage 1 complete");
    
    // TODO: Add your stage 1 completion logic here
    // Examples:
    // - Calculate initial scores
    // - Filter top submissions
  },

  // Called when judging stage 2 ends (at :02)
  judging_2: async (ctx) => {
    console.log("Judging stage 2 complete");
    
    // TODO: Add your stage 2 completion logic here
    // Examples:
    // - Run final tests
    // - Calculate weighted scores
  },

  // Called when judging stage 3 ends (at :03)
  judging_3: async (ctx) => {
    console.log("Judging stage 3 complete, determining winner");
    
    // TODO: Add your final judging logic here
    // Examples:
    // - Determine winner
    // - Update leaderboard
    // - Send notifications
    
    // Example: Add a random winner (replace with real logic)
    const winners = ["alice_dev", "bob_ninja", "charlie", "david_rust", "emma_js"];
    const winner = winners[Math.floor(Math.random() * winners.length)];
    
    const now = new Date();
    const hour = now.getHours();
    const period = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const contestHour = `${displayHour}:00${period}`;
    
    await ctx.db.insert("winners", {
      name: winner,
      timestamp: Date.now(),
      contestHour: contestHour,
      score: Math.floor(Math.random() * 1000) + 9000,
    });
  },

  // Called when break ends (at :05)
  break: async (ctx) => {
    console.log("Break ended, new contest starting");
    
    // TODO: Add your contest start logic here
    // Examples:
    // - Reset submission system
    // - Clear temporary data
    // - Send contest start notifications
  },
};

/**
 * Internal mutation called by the stage transition system
 * DO NOT CALL DIRECTLY - this is triggered automatically
 */
export const handleStageEnd = internalMutation({
  args: {
    stage: v.union(
      v.literal("in_progress"),
      v.literal("judging_1"),
      v.literal("judging_2"),
      v.literal("judging_3"),
      v.literal("break")
    ),
    wasSkipped: v.boolean(),
  },
  handler: async (ctx, { stage, wasSkipped }) => {
    console.log(`Stage ${stage} ended (skipped: ${wasSkipped})`);
    
    try {
      // Call the appropriate handler
      const handler = stageEndHandlers[stage];
      if (handler) {
        await handler(ctx);
      }
    } catch (error) {
      console.error(`Error handling end of stage ${stage}:`, error);
      // Don't throw - we don't want to break the stage transition system
    }
  },
});

// Import for type checking
import { v } from "convex/values";
