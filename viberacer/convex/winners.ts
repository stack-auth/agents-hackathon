import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getLastWinner = query({
  args: {},
  handler: async (ctx) => {
    const winners = await ctx.db
      .query("winners")
      .withIndex("by_timestamp")
      .order("desc")
      .first();
    
    return winners;
  },
});

export const addWinner = mutation({
  args: {
    name: v.string(),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("winners", {
      name: args.name,
      timestamp: Date.now(),
      score: args.score,
    });
  },
});