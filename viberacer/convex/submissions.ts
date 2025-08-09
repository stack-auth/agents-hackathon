import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
  args: { url: v.string() },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
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
        q.eq("userId", userId).eq("contestId", contestId)
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
        userId,
        url: args.url,
        contestId,
        submittedAt: Date.now(),
      });
      return { success: true, updated: false };
    }
  },
});

export const getMySubmission = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    const contestId = getCurrentContestId();
    
    const submission = await ctx.db
      .query("submissions")
      .withIndex("by_user_contest", q => 
        q.eq("userId", userId).eq("contestId", contestId)
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
    
    // Get user info for each submission
    const submissionsWithUsers = await Promise.all(
      submissions.map(async (sub) => {
        const user = await ctx.db.get(sub.userId);
        return {
          ...sub,
          userName: user?.name || user?.email || "Anonymous",
        };
      })
    );
    
    return submissionsWithUsers;
  },
});