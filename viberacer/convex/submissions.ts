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

