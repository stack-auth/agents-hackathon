import { DatabaseReader } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Calculate the average rating for a submission across all categories
 * This is modular so we can swap it out for ELO or other ranking systems later
 */
export async function calculateSubmissionScore(
  db: DatabaseReader,
  submissionId: Id<"submission">,
  stage: number
): Promise<number | null> {
  // Get all reviews for this submission at the specified stage
  // Note: We don't have an index by submission, so we need to filter differently
  const submission = await db.get(submissionId);
  if (!submission) return null;
  
  const reviews = await db
    .query("submissionReview")
    .filter((q: any) => 
      q.and(
        q.eq(q.field("repoId"), submission.repoId),
        q.eq(q.field("stage"), stage)
      )
    )
    .collect();
  
  if (reviews.length === 0) return null;
  
  // Calculate average across all categories and all reviews
  const totalScore = reviews.reduce((sum, review) => {
    const reviewAvg = (review.themeRating + review.designRating + review.functionalityRating) / 3;
    return sum + reviewAvg;
  }, 0);
  
  return totalScore / reviews.length;
}

/**
 * Group submissions by similar scores for stage 2 and 3 matching
 * Returns groups of submission IDs with similar scores
 */
export async function groupSubmissionsByScore(
  db: DatabaseReader,
  contestId: Id<"contests">,
  previousStage: number,
  groupSize: number = 4
): Promise<Id<"submission">[][]> {
  // Get all submissions for this contest
  const submissions = await db
    .query("submission")
    .withIndex("by_contest", (q: any) => q.eq("contestId", contestId))
    .collect();
  
  // Calculate scores for each submission
  const submissionsWithScores = await Promise.all(
    submissions.map(async (sub) => ({
      id: sub._id,
      score: await calculateSubmissionScore(db, sub._id, previousStage),
      userId: sub.userId,
    }))
  );
  
  // Filter out submissions without scores (didn't get reviewed)
  const scoredSubmissions = submissionsWithScores
    .filter(s => s.score !== null)
    .sort((a, b) => (a.score || 0) - (b.score || 0));
  
  // Group into buckets of similar scores
  const groups: Id<"submission">[][] = [];
  for (let i = 0; i < scoredSubmissions.length; i += groupSize) {
    const group = scoredSubmissions.slice(i, i + groupSize).map(s => s.id);
    if (group.length >= 2) { // Only create groups with at least 2 submissions
      groups.push(group);
    }
  }
  
  // Add any unscored submissions to random groups
  const unscoredSubmissions = submissionsWithScores
    .filter(s => s.score === null)
    .map(s => s.id);
  
  if (unscoredSubmissions.length > 0) {
    // Distribute unscored submissions across existing groups
    unscoredSubmissions.forEach((subId, idx) => {
      if (groups.length > 0) {
        groups[idx % groups.length].push(subId);
      }
    });
  }
  
  return groups;
}

/**
 * Get all users who submitted to a contest
 */
export async function getContestParticipants(
  db: DatabaseReader,
  contestId: Id<"contests">
): Promise<string[]> {
  const submissions = await db
    .query("submission")
    .withIndex("by_contest", (q: any) => q.eq("contestId", contestId))
    .collect();
  
  return [...new Set(submissions.map(s => s.userId))];
}