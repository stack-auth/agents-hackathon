import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  numbers: defineTable({
    value: v.number(),
  }),
  winners: defineTable({
    name: v.string(),
    timestamp: v.number(),
    contestHour: v.optional(v.string()), // e.g. "3:00am", "11:00pm" - optional for migration
    score: v.optional(v.number()),
  }).index("by_timestamp", ["timestamp"]),
  stageTracker: defineTable({
    currentStage: v.union(
      v.literal("in_progress"),
      v.literal("judging_1"),
      v.literal("judging_2"),
      v.literal("judging_3"),
      v.literal("break")
    ),
    lastTransition: v.number(),
  }),
  contestState: defineTable({
    skippedStage: v.optional(v.union(
      v.literal("in_progress"),
      v.literal("judging_1"),
      v.literal("judging_2"),
      v.literal("judging_3"),
      v.literal("break")
    )),
    skippedTo: v.optional(v.union(
      v.literal("in_progress"),
      v.literal("judging_1"),
      v.literal("judging_2"),
      v.literal("judging_3"),
      v.literal("break")
    )),
    skippedAt: v.optional(v.number()),
    // Legacy fields for migration
    stage: v.optional(v.union(
      v.literal("in_progress"),
      v.literal("judging_1"),
      v.literal("judging_2"),
      v.literal("judging_3"),
      v.literal("break")
    )),
    startedAt: v.optional(v.number()),
    manualOverride: v.optional(v.boolean()),
  }),
  submission: defineTable({
    repoId: v.string(),
    timestamp: v.number(),
    username: v.optional(v.string()),
  }),
  submissionReview: defineTable({
    repoId: v.string(),
    rating: v.number(),
    timestamp: v.number(),
  }),
  stageState: defineTable({
    currentStage: v.union(
      v.literal("in_progress"),
      v.literal("judging_1"),
      v.literal("judging_2"),
      v.literal("judging_3"),
      v.literal("break")
    ),
    nextStageTime: v.number(), // Unix timestamp when next stage starts
    lastCheckedTime: v.number(), // Unix timestamp of last check
    wasSkipped: v.boolean(), // Whether current stage was manually skipped
  }),
  submissions: defineTable({
    userId: v.id("users"),
    url: v.string(),
    contestId: v.string(), // Format: "YYYY-MM-DD-HH" for the hour the contest started
    submittedAt: v.number(), // Unix timestamp
    score: v.optional(v.number()), // Will be set during judging
    feedback: v.optional(v.string()), // Judging feedback
  })
    .index("by_user", ["userId"])
    .index("by_contest", ["contestId"])
    .index("by_user_contest", ["userId", "contestId"]),
});
