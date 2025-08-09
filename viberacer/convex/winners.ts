import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getLastWinner = query({
  args: {},
  handler: async (ctx) => {
    // Get all winners
    const allWinners = await ctx.db
      .query("winners")
      .collect();
    
    // If no winners exist, return null
    if (allWinners.length === 0) {
      return null;
    }
    
    // Return a random winner from the database
    const randomIndex = Math.floor(Math.random() * allWinners.length);
    return allWinners[randomIndex];
  },
});

export const getWeeklyTopWinners = query({
  args: {},
  handler: async (ctx) => {
    // Get all winners from the past week
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const allWinners = await ctx.db
      .query("winners")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), oneWeekAgo))
      .collect();
    
    // Group by name and count wins
    const winCounts = new Map<string, number>();
    for (const winner of allWinners) {
      const count = winCounts.get(winner.name) || 0;
      winCounts.set(winner.name, count + 1);
    }
    
    // Convert to array and sort by win count
    const topWinners = Array.from(winCounts.entries())
      .map(([name, wins]) => ({ name, wins }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 3);
    
    // If not enough data, return some sample data
    if (topWinners.length === 0) {
      return [
        { name: "alice_dev", wins: 5 },
        { name: "bob_ninja", wins: 3 },
        { name: "charlie", wins: 2 },
      ];
    }
    
    return topWinners;
  },
});

export const addWinner = mutation({
  args: {
    name: v.string(),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const hour = now.getHours();
    const period = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const contestHour = `${displayHour}:00${period}`;
    
    await ctx.db.insert("winners", {
      name: args.name,
      timestamp: Date.now(),
      contestHour: contestHour,
      score: args.score,
    });
  },
});