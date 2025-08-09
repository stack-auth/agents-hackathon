import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserJudgingAssignments, hasCompletedJudging } from "./judgingAssignments";

// Get current user's judging assignments
export const getMyJudgingAssignments = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return null;
    
    // Get active contest
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .first();
    
    if (!activeContest) return null;
    
    // Get current stage
    const stageState = await ctx.db.query("stageState").first();
    if (!stageState) return null;
    
    // Get stage number from stage name
    let stageNumber = 0;
    if (stageState.currentStage === "judging_1") stageNumber = 1;
    else if (stageState.currentStage === "judging_2") stageNumber = 2;
    else if (stageState.currentStage === "judging_3") stageNumber = 3;
    else return null; // Not in a judging stage
    
    // Get assignments
    const assignments = await getUserJudgingAssignments(
      ctx.db,
      activeContest._id,
      args.userId,
      stageNumber
    );
    
    // Check if user submitted to this contest
    const userSubmission = await ctx.db
      .query("submission")
      .withIndex("by_contest_user", (q: any) => 
        q.eq("contestId", activeContest._id).eq("userId", args.userId)
      )
      .first();
    
    return {
      assignments,
      stageNumber,
      hasSubmission: !!userSubmission,
      allCompleted: await hasCompletedJudging(ctx.db, activeContest._id, args.userId, stageNumber),
    };
  },
});

// Submit a review for a submission
export const submitReview = mutation({
  args: {
    userId: v.string(),
    submissionId: v.id("submission"),
    themeRating: v.number(),
    designRating: v.number(),
    functionalityRating: v.number(),
  },
  handler: async (ctx, args) => {
    // Get active contest
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .first();
    
    if (!activeContest) {
      throw new Error("No active contest");
    }
    
    // Get current stage
    const stageState = await ctx.db.query("stageState").first();
    if (!stageState) throw new Error("No stage state");
    
    // Get stage number
    let stageNumber = 0;
    if (stageState.currentStage === "judging_1") stageNumber = 1;
    else if (stageState.currentStage === "judging_2") stageNumber = 2;
    else if (stageState.currentStage === "judging_3") stageNumber = 3;
    else throw new Error("Not in a judging stage");
    
    // Get the submission
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");
    
    // Check if user has this assignment
    const assignment = await ctx.db
      .query("judgingAssignments")
      .withIndex("by_contest_judge_stage", (q: any) => 
        q.eq("contestId", activeContest._id)
         .eq("judgeUserId", args.userId)
         .eq("stage", stageNumber)
      )
      .filter((q: any) => q.eq(q.field("submissionId"), args.submissionId))
      .first();
    
    if (!assignment) {
      throw new Error("You are not assigned to review this submission");
    }
    
    // Check if already reviewed
    if (assignment.completed) {
      throw new Error("You have already reviewed this submission");
    }
    
    // Create the review
    await ctx.db.insert("submissionReview", {
      contestId: activeContest._id,
      userId: args.userId,
      repoId: submission.repoId,
      themeRating: args.themeRating,
      designRating: args.designRating,
      functionalityRating: args.functionalityRating,
      timestamp: Date.now(),
      stage: stageNumber,
    });
    
    // Mark assignment as completed
    await ctx.db.patch(assignment._id, {
      completed: true,
      completedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Get judging stats for admin
export const getJudgingStats = query({
  args: {
    contestId: v.optional(v.id("contests")),
  },
  handler: async (ctx, args) => {
    let contestId = args.contestId;
    
    if (!contestId) {
      // Get active contest if not specified
      const activeContest = await ctx.db
        .query("contests")
        .withIndex("by_status", (q: any) => q.eq("status", "active"))
        .order("desc")
        .first();
      
      if (!activeContest) return null;
      contestId = activeContest._id;
    }
    
    // Get all assignments for this contest
    const assignments = await ctx.db
      .query("judgingAssignments")
      .withIndex("by_contest_judge", (q: any) => q.eq("contestId", contestId))
      .collect();
    
    // Group by stage
    const byStage = {
      1: assignments.filter(a => a.stage === 1),
      2: assignments.filter(a => a.stage === 2),
      3: assignments.filter(a => a.stage === 3),
    };
    
    // Calculate stats for each stage
    const stats = Object.entries(byStage).map(([stage, stageAssignments]) => ({
      stage: Number(stage),
      totalAssignments: stageAssignments.length,
      completedAssignments: stageAssignments.filter(a => a.completed).length,
      completionRate: stageAssignments.length > 0 
        ? (stageAssignments.filter(a => a.completed).length / stageAssignments.length * 100).toFixed(1)
        : 0,
      uniqueJudges: [...new Set(stageAssignments.map(a => a.judgeUserId))].length,
    }));
    
    return {
      contestId,
      stats,
      totalAssignments: assignments.length,
      totalCompleted: assignments.filter(a => a.completed).length,
    };
  },
});