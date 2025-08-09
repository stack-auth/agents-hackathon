import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get or create a contest for the current hour
export const getOrCreateCurrentContest = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    
    // Round down to the current hour for scheduled timestamp
    const scheduledHour = new Date(now);
    scheduledHour.setMinutes(0, 0, 0);
    const scheduledTimestamp = scheduledHour.getTime();
    
    // Check if contest already exists for this hour
    const existing = await ctx.db
      .query("contests")
      .withIndex("by_scheduled", q => q.eq("scheduledTimestamp", scheduledTimestamp))
      .first();
    
    if (existing) {
      // If contest exists but is not active, update it
      if (existing.status !== "active") {
        await ctx.db.patch(existing._id, {
          status: "active",
          actualTimestamp: Date.now(),
        });
      }
      return existing._id;
    }
    
    // Create new contest
    const contestId = await ctx.db.insert("contests", {
      type: "hourly",
      scheduledTimestamp,
      actualTimestamp: Date.now(),
      status: "active",
    });
    
    return contestId;
  },
});

// Get active contest
export const getActiveContest = query({
  args: {},
  handler: async (ctx) => {
    const activeContest = await ctx.db
      .query("contests")
      .withIndex("by_status", q => q.eq("status", "active"))
      .order("desc")
      .first();
    
    return activeContest;
  },
});

// Mark contest as completed
export const completeContest = mutation({
  args: {
    contestId: v.id("contests"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contestId, {
      status: "completed",
      endTimestamp: Date.now(),
    });
  },
});

// Get contest by ID
export const getContest = query({
  args: {
    contestId: v.id("contests"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contestId);
  },
});

// Get recent contests
export const getRecentContests = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const contests = await ctx.db
      .query("contests")
      .withIndex("by_actual")
      .order("desc")
      .take(limit);
    
    return contests;
  },
});