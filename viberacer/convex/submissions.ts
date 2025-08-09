import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createSubmission = mutation({
  args: {
    repoId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("submission", {
      repoId: args.repoId,
      timestamp: Date.now(),
      username: args.username,
    });
  },
});

export const getRandomSubmissionsExcluding = query({
  args: {
    excludeRepoId: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("submission").collect();
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("submissionReview", {
      repoId: args.repoId,
      rating: args.rating,
      timestamp: Date.now(),
    });
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

// Get current contest ID (hour when contest started)
function getCurrentContestId(): string {
  const now = new Date();
  // Contest starts at :05 of each hour
  const contestHour = new Date(now);
  
  // If we're before :05, the contest is from the previous hour
  if (now.getMinutes() < 5) {
    contestHour.setHours(contestHour.getHours() - 1);
  }
  
  // Set to :05 of the contest hour
  contestHour.setMinutes(5, 0, 0);
  
  const year = contestHour.getFullYear();
  const month = String(contestHour.getMonth() + 1).padStart(2, '0');
  const day = String(contestHour.getDate()).padStart(2, '0');
  const hour = String(contestHour.getHours()).padStart(2, '0');
  
  return `${year}-${month}-${day}-${hour}`;
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
    
    // Validate URL
    const validation = validateSubmissionUrl(args.url);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid URL");
    }
    
    const contestId = getCurrentContestId();
    
    // Check if user already submitted for this contest
    const existing = await ctx.db
      .query("submissions")
      .withIndex("by_user_contest", q => 
        q.eq("userId", args.userId).eq("contestId", contestId)
      )
      .first();
    
    if (existing) {
      // Update existing submission
      await ctx.db.patch(existing._id, {
        url: args.url,
        submittedAt: Date.now(),
      });
      return { success: true, updated: true };
    } else {
      // Create new submission
      await ctx.db.insert("submissions", {
        userId: args.userId,
        url: args.url,
        contestId,
        submittedAt: Date.now(),
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
    
    const contestId = getCurrentContestId();
    
    const submission = await ctx.db
      .query("submissions")
      .withIndex("by_user_contest", q => 
        q.eq("userId", args.userId!).eq("contestId", contestId)
      )
      .first();
    
    return submission;
  },
});

export const getCurrentContestSubmissions = query({
  args: {},
  handler: async (ctx) => {
    const contestId = getCurrentContestId();
    
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_contest", q => q.eq("contestId", contestId))
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
