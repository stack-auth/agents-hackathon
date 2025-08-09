import { internalMutation } from "./_generated/server";

export const clearAllWinners = internalMutation({
  args: {},
  handler: async (ctx) => {
    const winners = await ctx.db.query("winners").collect();
    for (const winner of winners) {
      await ctx.db.delete(winner._id);
    }
    return { deleted: winners.length };
  },
});