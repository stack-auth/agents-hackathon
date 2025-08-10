import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all contests with their submissions count
export const getAllContests = query({
  args: {},
  handler: async (ctx) => {
    const contests = await ctx.db
      .query("contests")
      .order("desc")
      .take(50);
    
    // Get submission counts for each contest
    const contestsWithStats = await Promise.all(
      contests.map(async (contest) => {
        const submissions = await ctx.db
          .query("submission")
          .withIndex("by_contest", (q: any) => q.eq("contestId", contest._id))
          .collect();
        
        const reviews = await ctx.db
          .query("submissionReview")
          .withIndex("by_contest", (q: any) => q.eq("contestId", contest._id))
          .collect();
        
        return {
          ...contest,
          submissionCount: submissions.length,
          reviewCount: reviews.length,
          participants: [...new Set(submissions.map(s => s.userId))].length,
        };
      })
    );
    
    return contestsWithStats;
  },
});

// Get detailed info for a specific contest
export const getContestDetails = query({
  args: {
    contestId: v.id("contests"),
  },
  handler: async (ctx, args) => {
    const contest = await ctx.db.get(args.contestId);
    if (!contest) return null;
    
    const submissions = await ctx.db
      .query("submission")
      .withIndex("by_contest", (q: any) => q.eq("contestId", args.contestId))
      .collect();
    
    const reviews = await ctx.db
      .query("submissionReview")
      .withIndex("by_contest", (q: any) => q.eq("contestId", args.contestId))
      .collect();
    
    // Group reviews by submission
    const reviewsBySubmission = submissions.map(sub => {
      const subReviews = reviews.filter(r => r.repoId === sub.repoId);
      const avgRating = subReviews.length > 0 
        ? subReviews.reduce((sum, r) => sum + (r.themeRating + r.designRating + r.functionalityRating) / 3, 0) / subReviews.length 
        : null;
      
      return {
        ...sub,
        reviews: subReviews,
        avgRating,
      };
    });
    
    return {
      contest,
      submissions: reviewsBySubmission,
      totalSubmissions: submissions.length,
      totalReviews: reviews.length,
      uniqueParticipants: [...new Set(submissions.map(s => s.userId))].length,
      uniqueReviewers: [...new Set(reviews.map(r => r.userId))].length,
    };
  },
});

// Get system stats
export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    const [
      totalContests,
      totalSubmissions,
      totalReviews,
      currentStage,
    ] = await Promise.all([
      ctx.db.query("contests").collect().then(c => c.length),
      ctx.db.query("submission").collect().then(s => s.length),
      ctx.db.query("submissionReview").collect().then(r => r.length),
      ctx.db.query("stageState").first(),
    ]);
    
    // Get unique users (approximation based on unique userIds)
    const allSubmissions = await ctx.db.query("submission").collect();
    const allReviews = await ctx.db.query("submissionReview").collect();
    const uniqueUsers = new Set([
      ...allSubmissions.map(s => s.userId),
      ...allReviews.map(r => r.userId),
    ]);
    
    // Get active contest
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .first();
    
    return {
      totalContests,
      totalSubmissions,
      totalReviews,
      uniqueUsers: uniqueUsers.size,
      currentStage: currentStage?.currentStage || "unknown",
      activeContestId: activeContest?._id,
    };
  },
});

// Get recent activity
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    // Get recent submissions
    const submissions = await ctx.db
      .query("submission")
      .order("desc")
      .take(limit);
    
    // Get recent reviews
    const reviews = await ctx.db
      .query("submissionReview")
      .order("desc")
      .take(limit);
    
    // Combine and sort by timestamp
    const activities = [
      ...submissions.map(s => ({
        type: "submission" as const,
        timestamp: s.timestamp,
        userId: s.userId,
        contestId: s.contestId,
        repoId: s.repoId,
      })),
      ...reviews.map(r => ({
        type: "review" as const,
        timestamp: r.timestamp,
        userId: r.userId,
        contestId: r.contestId,
        repoId: r.repoId,
        avgRating: (r.themeRating + r.designRating + r.functionalityRating) / 3,
      })),
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    
    return activities;
  },
});

// Get user participation stats
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const allSubmissions = await ctx.db.query("submission").collect();
    const allReviews = await ctx.db.query("submissionReview").collect();
    
    // Create user stats map
    const userStats = new Map<string, {
      userId: string,
      submissions: number,
      reviews: number,
      contests: Set<string>,
      lastActive: number,
    }>();
    
    // Process submissions
    for (const sub of allSubmissions) {
      const stats = userStats.get(sub.userId) || {
        userId: sub.userId,
        submissions: 0,
        reviews: 0,
        contests: new Set(),
        lastActive: 0,
      };
      stats.submissions++;
      stats.contests.add(sub.contestId);
      stats.lastActive = Math.max(stats.lastActive, sub.timestamp);
      userStats.set(sub.userId, stats);
    }
    
    // Process reviews
    for (const review of allReviews) {
      const stats = userStats.get(review.userId) || {
        userId: review.userId,
        submissions: 0,
        reviews: 0,
        contests: new Set(),
        lastActive: 0,
      };
      stats.reviews++;
      stats.contests.add(review.contestId);
      stats.lastActive = Math.max(stats.lastActive, review.timestamp);
      userStats.set(review.userId, stats);
    }
    
    // Convert to array and sort by activity
    const userStatsArray = Array.from(userStats.values()).map(stats => ({
      userId: stats.userId,
      submissions: stats.submissions,
      reviews: stats.reviews,
      contestCount: stats.contests.size,  // Convert Set size to number
      lastActive: stats.lastActive,
      // Don't include the Set itself, just its size
    }));
    
    return userStatsArray.sort((a, b) => b.submissions - a.submissions);
  },
});