import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  submissionCount: number;
  reviewCount: number;
  completedAllReviews: boolean;
}

/**
 * Calculate leaderboard for a specific contest
 * Only includes users who have completed at least 5 reviews
 */
export const getContestLeaderboard = query({
  args: {
    contestId: v.id("contests"),
  },
  handler: async (ctx, args) => {
    return await calculateLeaderboard(ctx, args.contestId);
  },
});

/**
 * Get the winner (top scorer) of a contest
 */
export const calculateLeaderboard = async (ctx: any, contestId: any) => {
  // Get all submissions for this contest
  const submissions = await ctx.db
    .query("submission")
    .withIndex("by_contest", (q: any) => q.eq("contestId", contestId))
    .collect();
  
  // Get all reviews for this contest (across all stages)
  const allReviews = await ctx.db
    .query("submissionReview")
    .withIndex("by_contest", (q: any) => q.eq("contestId", contestId))
    .collect();
  
  // Get all judging assignments to check completion
  const assignments = await ctx.db
    .query("judgingAssignments")
    .withIndex("by_contest_judge", (q: any) => q.eq("contestId", contestId))
    .collect();
  
  // Calculate scores for each user
  const userScores = new Map<string, {
    userId: string,
    totalScore: number,
    reviewsReceived: number,
    submissionCount: number,
    reviewsGiven: number,
    assignmentsCompleted: number,
    totalAssignments: number,
  }>();
  
  // Process submissions and their reviews
  for (const submission of submissions) {
    const userReviews = allReviews.filter((r: any) => r.repoId === submission.repoId);
    
    if (userReviews.length > 0) {
      const avgScore = userReviews.reduce((sum: number, r: any) => {
        const reviewScore = (r.themeRating + r.designRating + r.functionalityRating) / 3;
        return sum + reviewScore;
      }, 0) / userReviews.length;
      
      const existing = userScores.get(submission.userId) || {
        userId: submission.userId,
        totalScore: 0,
        reviewsReceived: 0,
        submissionCount: 0,
        reviewsGiven: 0,
        assignmentsCompleted: 0,
        totalAssignments: 0,
      };
      
      existing.totalScore += avgScore;
      existing.reviewsReceived += userReviews.length;
      existing.submissionCount += 1;
      
      userScores.set(submission.userId, existing);
    }
  }
  
  // Count reviews given by each user
  for (const review of allReviews) {
    const existing = userScores.get(review.userId) || {
      userId: review.userId,
      totalScore: 0,
      reviewsReceived: 0,
      submissionCount: 0,
      reviewsGiven: 0,
      assignmentsCompleted: 0,
      totalAssignments: 0,
    };
    existing.reviewsGiven += 1;
    userScores.set(review.userId, existing);
  }
  
  // Count completed assignments
  for (const assignment of assignments) {
    const existing = userScores.get(assignment.judgeUserId);
    if (existing) {
      existing.totalAssignments += 1;
      if (assignment.completed) {
        existing.assignmentsCompleted += 1;
      }
    }
  }
  
  // Filter to only include users who have given at least 5 reviews
  const qualifiedUsers = Array.from(userScores.values())
    .filter(user => user.reviewsGiven >= 5 && user.submissionCount > 0);
  
  // Calculate final scores and sort
  const rankedUsers = qualifiedUsers
    .map(user => ({
      ...user,
      finalScore: user.totalScore / user.submissionCount, // Average score across submissions
    }))
    .sort((a, b) => b.finalScore - a.finalScore);
  
  // Assign ranks and format output
  const leaderboard: LeaderboardEntry[] = rankedUsers.map((user, index) => ({
    rank: index + 1,
    userId: user.userId,
    displayName: user.userId, // Will be replaced with actual display name from Stack Auth
    score: Math.round(user.finalScore * 100) / 100,
    submissionCount: user.submissionCount,
    reviewCount: user.reviewsGiven,
    completedAllReviews: user.assignmentsCompleted === user.totalAssignments,
  }));
  
  return leaderboard;
};

export const getContestWinner = query({
  args: {
    contestId: v.id("contests"),
  },
  handler: async (ctx, args) => {
    const leaderboard = await calculateLeaderboard(ctx, args.contestId);
    
    if (leaderboard.length === 0) return null;
    
    return leaderboard[0];
  },
});

/**
 * Get recent contest winners
 */
export const getRecentWinners = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    
    // Get recent completed contests
    const contests = await ctx.db
      .query("contests")
      .withIndex("by_status", (q: any) => q.eq("status", "completed"))
      .order("desc")
      .take(limit);
    
    // Get winner for each contest
    const winners = await Promise.all(
      contests.map(async (contest) => {
        const leaderboard = await calculateLeaderboard(ctx, contest._id);
        
        if (leaderboard.length === 0) return null;
        
        const winner = leaderboard[0];
        const contestDate = new Date(contest.actualTimestamp);
        const hour = contestDate.getHours();
        const period = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        
        return {
          name: winner.displayName,
          userId: winner.userId,
          contestHour: `${displayHour}:00${period}`,
          timestamp: contest.actualTimestamp,
          score: winner.score,
        };
      })
    );
    
    return winners.filter(w => w !== null);
  },
});

/**
 * Get weekly top winners (users with most wins)
 */
export const getWeeklyTopWinners = query({
  args: {},
  handler: async (ctx) => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Get contests from the past week
    const contests = await ctx.db
      .query("contests")
      .withIndex("by_status", (q: any) => q.eq("status", "completed"))
      .filter((q: any) => q.gte(q.field("actualTimestamp"), oneWeekAgo))
      .collect();
    
    // Count wins per user
    const winCounts = new Map<string, { userId: string, displayName: string, wins: number }>();
    
    for (const contest of contests) {
      const leaderboard = await calculateLeaderboard(ctx, contest._id);
      
      if (leaderboard.length > 0) {
        const winner = leaderboard[0];
        const existing = winCounts.get(winner.userId) || {
          userId: winner.userId,
          displayName: winner.displayName,
          wins: 0,
        };
        existing.wins += 1;
        winCounts.set(winner.userId, existing);
      }
    }
    
    // Sort by win count and return top 3
    const topWinners = Array.from(winCounts.values())
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 3)
      .map(w => ({
        name: w.displayName,
        userId: w.userId,
        wins: w.wins,
      }));
    
    return topWinners;
  },
});

