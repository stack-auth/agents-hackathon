import { query } from "./_generated/server";
import { v } from "convex/values";

export interface UserActivity {
  date: string; // YYYY-MM-DD
  participated: boolean;
  won: boolean;
  contestId?: string;
  score?: number;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  firstSeen: number;
  totalContests: number;
  totalWins: number;
  totalSubmissions: number;
  totalReviews: number;
  averageScore: number;
  activityMap: UserActivity[];
}

/**
 * Get user profile data including activity heatmap
 */
export const getUserProfile = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all submissions by this user
    const submissions = await ctx.db
      .query("submission")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
    
    // Get all reviews by this user
    const reviews = await ctx.db
      .query("submissionReview")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
    
    // Get contest IDs where user participated
    const contestIds = new Set<string>();
    submissions.forEach(s => contestIds.add(s.contestId));
    
    // Get contest details
    const contests = await Promise.all(
      Array.from(contestIds).map(id => ctx.db.get(id as any))
    );
    
    // Build activity map
    const activityMap = new Map<string, UserActivity>();
    let totalScore = 0;
    let scoreCount = 0;
    let totalWins = 0;
    let firstSeen = Date.now();
    
    for (const contest of contests) {
      if (!contest) continue;
      
      const date = new Date(contest.actualTimestamp);
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if user won this contest
      const { getContestLeaderboard } = await import("./leaderboard");
      const leaderboard = await getContestLeaderboard.handler(ctx, {
        contestId: contest._id,
      });
      
      const userEntry = leaderboard.find(e => e.userId === args.userId);
      const won = userEntry?.rank === 1;
      
      if (won) totalWins++;
      
      if (userEntry) {
        totalScore += userEntry.score;
        scoreCount++;
      }
      
      // Track earliest activity
      if (contest.actualTimestamp < firstSeen) {
        firstSeen = contest.actualTimestamp;
      }
      
      activityMap.set(dateStr, {
        date: dateStr,
        participated: true,
        won,
        contestId: contest._id,
        score: userEntry?.score,
      });
    }
    
    // Generate activity array for the past year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const activityArray: UserActivity[] = [];
    
    for (let d = new Date(oneYearAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const activity = activityMap.get(dateStr);
      
      activityArray.push(activity || {
        date: dateStr,
        participated: false,
        won: false,
      });
    }
    
    // If no activity found, use first review time as firstSeen
    if (submissions.length === 0 && reviews.length > 0) {
      firstSeen = Math.min(...reviews.map(r => r.timestamp));
    }
    
    return {
      userId: args.userId,
      displayName: args.userId, // Will be replaced with Stack Auth display name
      firstSeen,
      totalContests: contestIds.size,
      totalWins,
      totalSubmissions: submissions.length,
      totalReviews: reviews.length,
      averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
      activityMap: activityArray,
    };
  },
});

/**
 * Get user stats for display (lighter version without activity map)
 */
export const getUserStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await getUserProfile.handler(ctx, { userId: args.userId });
    
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      totalContests: profile.totalContests,
      totalWins: profile.totalWins,
      averageScore: profile.averageScore,
    };
  },
});