import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createSubmission = mutation({
  args: {
    repoId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get active contest
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", q => q.eq("status", "active"))
      .order("desc")
      .first();
    
    if (!activeContest) {
      throw new Error("No active contest found");
    }
    
    // Check if user already submitted for this contest
    const existing = await ctx.db
      .query("submission")
      .withIndex("by_contest_user", q => 
        q.eq("contestId", activeContest._id).eq("userId", args.userId)
      )
      .first();
    
    if (existing) {
      // Update existing submission
      await ctx.db.patch(existing._id, {
        repoId: args.repoId,
        timestamp: Date.now(),
      });
    } else {
      // Create new submission
      await ctx.db.insert("submission", {
        contestId: activeContest._id,
        userId: args.userId,
        repoId: args.repoId,
        timestamp: Date.now(),
      });
    }
  },
});

export const getRandomSubmissionsExcluding = query({
  args: {
    excludeRepoId: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Get active contest
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", q => q.eq("status", "active"))
      .order("desc")
      .first();
    
    if (!activeContest) {
      return [];
    }
    
    const all = await ctx.db
      .query("submission")
      .withIndex("by_contest", q => q.eq("contestId", activeContest._id))
      .collect();
    
    const pool = all.filter((s) => s.repoId !== args.excludeRepoId);
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, Math.min(args.limit, pool.length));
    return picked.map((s) => s.repoId);
  },
});

export const createSubmissionReview = mutation({
  args: {
    repoId: v.string(),
    rating: v.number(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get active contest
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", q => q.eq("status", "active"))
      .order("desc")
      .first();
    
    if (!activeContest) {
      throw new Error("No active contest found");
    }
    
    // Check if user already reviewed for this contest
    const existing = await ctx.db
      .query("submissionReview")
      .withIndex("by_contest_user", q => 
        q.eq("contestId", activeContest._id).eq("userId", args.userId)
      )
      .first();
    
    if (existing) {
      // Update existing review
      await ctx.db.patch(existing._id, {
        repoId: args.repoId,
        rating: args.rating,
        timestamp: Date.now(),
      });
    } else {
      // Create new review
      await ctx.db.insert("submissionReview", {
        contestId: activeContest._id,
        userId: args.userId,
        repoId: args.repoId,
        rating: args.rating,
        timestamp: Date.now(),
      });
    }
  },
});

// Validate submission URL
export function validateSubmissionUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    // For now, allow all URLs
    // TODO: In the future, only allow our own URLs
    // if (!parsed.hostname.includes('viberacer.com')) {
    //   return { valid: false, error: "Only Viberacer URLs are allowed" };
    // }
    
    // Basic validation
    if (!parsed.protocol.startsWith('http')) {
      return { valid: false, error: "URL must start with http:// or https://" };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}


export const submitUrl = mutation({
  args: { 
    url: v.string(),
    userId: v.string() // Pass userId from client
  },
  handler: async (ctx, args) => {
    // Verify user is authenticated (userId passed from client)
    if (!args.userId) {
      throw new Error("Must be authenticated to submit");
    }
    
    // Check if contest is in progress
    const stageState = await ctx.db.query("stageState").first();
    if (!stageState || stageState.currentStage !== "in_progress") {
      throw new Error("Submissions are only accepted during contest time");
    }
    
    // Get active contest
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .first();
    
    if (!activeContest) {
      throw new Error("No active contest found");
    }
    
    // Validate URL
    const validation = validateSubmissionUrl(args.url);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid URL");
    }
    
    // Check if user already submitted for this contest
    const existing = await ctx.db
      .query("submission")
      .withIndex("by_contest_user", (q: any) => 
        q.eq("contestId", activeContest._id).eq("userId", args.userId)
      )
      .first();
    
    if (existing) {
      // Update existing submission
      await ctx.db.patch(existing._id, {
        repoId: args.url,
        timestamp: Date.now(),
      });
      return { success: true, updated: true };
    } else {
      // Create new submission  
      await ctx.db.insert("submission", {
        contestId: activeContest._id,
        userId: args.userId,
        repoId: args.url,
        timestamp: Date.now(),
      });
      return { success: true, updated: false };
    }
  },
});

export const getMySubmission = query({
  args: {
    userId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return null;
    }
    
    // Get active contest
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .first();
    
    if (!activeContest) {
      return null;
    }
    
    const submission = await ctx.db
      .query("submission")
      .withIndex("by_contest_user", (q: any) => 
        q.eq("contestId", activeContest._id).eq("userId", args.userId!)
      )
      .first();
    
    return submission ? { ...submission, url: submission.repoId } : null;
  },
});

export const getCurrentContestSubmissions = query({
  args: {},
  handler: async (ctx) => {
    // Get active contest
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .first();
    
    if (!activeContest) {
      return [];
    }
    
    const submissions = await ctx.db
      .query("submission")
      .withIndex("by_contest", (q: any) => q.eq("contestId", activeContest._id))
      .collect();
    
    // For now, just return submissions with userId as userName
    // In a real app, you'd want to store user display names separately
    const submissionsWithUsers = submissions.map((sub) => ({
      ...sub,
      userName: sub.userId, // Using userId as display name for now
    }));
    
    return submissionsWithUsers;
  },
});
