import { internalMutation } from "./_generated/server";

export const seedWinners = internalMutation({
  args: {},
  handler: async (ctx) => {
    const winners = [
      { name: "alice_dev", timestamp: Date.now() - 3600000, raceHour: "11:00am", score: 9850 },
      { name: "bob_ninja", timestamp: Date.now() - 7200000, raceHour: "10:00am", score: 9720 },
      { name: "charlie", timestamp: Date.now() - 10800000, raceHour: "9:00am", score: 9600 },
      { name: "david_rust", timestamp: Date.now() - 14400000, raceHour: "8:00am", score: 9500 },
      { name: "emma_js", timestamp: Date.now() - 18000000, raceHour: "7:00am", score: 9450 },
    ];

    for (const winner of winners) {
      await ctx.db.insert("winners", winner);
    }
    
    return { success: true, inserted: winners.length };
  },
});