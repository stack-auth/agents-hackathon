import { internalMutation } from "./_generated/server";
import { prepareContestForJudging } from "./contestHelpers";
import { createJudgingAssignments } from "./judgingAssignments";

type ContestStage = "in_progress" | "judging_1" | "judging_2" | "judging_3" | "break";

// KEEP THIS FILE CLEAN. KEEP OPERATIONS THAT CAN BE EXTRACTED INTO FUNCTIONS IN OTHER FILES, AND USE THEM HERE. IT SHOULD BE EASY TO READ AND UNDERSTAND THIS FILE.

/**
 * Stage transition handlers - called when a stage ends
 * Edit this file to add custom logic when stages complete
 */
const stageEndHandlers: Record<ContestStage, (ctx: any) => Promise<void>> = {
  // Called when contest ends (at :00)
  in_progress: async (ctx) => {
    // Get active contest before marking it complete
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .first();
    
    if (activeContest) {
      // DON'T mark as completed yet - keep it active during judging
      console.log(`Contest ${activeContest._id} ended, starting judging phase`);
      
      // Create judging assignments for stage 1
      await createJudgingAssignments(ctx.db, activeContest._id, 1);
    }
    
    // Prepare for judging
    const submissions = await prepareContestForJudging(ctx.db);
    console.log(`${submissions.length} submissions ready for judging`);
  },

  // Called when judging stage 1 ends (at :01)
  judging_1: async (ctx) => {
    console.log("Judging stage 1 complete");
    
    // Get active contest
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .first();
    
    if (activeContest) {
      // Create judging assignments for stage 2 (grouped by scores)
      await createJudgingAssignments(ctx.db, activeContest._id, 2);
    }
  },

  // Called when judging stage 2 ends (at :02)
  judging_2: async (ctx) => {
    console.log("Judging stage 2 complete");
    
    // Get active contest
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .first();
    
    if (activeContest) {
      // Create judging assignments for stage 3 (grouped by scores)
      await createJudgingAssignments(ctx.db, activeContest._id, 3);
    }
  },

  // Called when judging stage 3 ends (at :03)
  judging_3: async (ctx) => {
    console.log("Judging stage 3 complete, determining winner");
    
    // Get active contest
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .first();
    
    if (activeContest) {
      // Mark contest as completed now that judging is done
      await ctx.db.patch(activeContest._id, {
        status: "completed",
        endTimestamp: Date.now(),
      });
      
      // TODO: Calculate real winner based on scores
      // For now, add a random winner (replace with real logic)
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
    }
  },

  // Called when break ends (at :05)
  break: async (ctx) => {
    console.log("Break ended, new contest starting");
    
    // Always create a new contest for the upcoming in_progress stage
    const now = new Date();
    
    // Round down to the current hour for scheduled timestamp
    const scheduledHour = new Date(now);
    scheduledHour.setMinutes(0, 0, 0);
    const scheduledTimestamp = scheduledHour.getTime();
    
    // Always create a new contest - there can be multiple per hour due to skipping
    const contestId = await ctx.db.insert("contests", {
      type: "hourly",
      scheduledTimestamp,
      actualTimestamp: Date.now(),
      status: "active",
    });
    console.log(`Created new contest: ${contestId}`);
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
