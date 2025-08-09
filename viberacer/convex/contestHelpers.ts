import { DatabaseReader, DatabaseWriter } from "./_generated/server";

/**
 * Get all submissions for the current contest
 */
export async function getCurrentContestSubmissions(db: DatabaseReader) {
  // Get active contest
  const activeContest = await db
    .query("contests")
    .withIndex("by_status", (q: any) => q.eq("status", "active"))
    .order("desc")
    .first();
  
  if (!activeContest) {
    return [];
  }
  
  const submissions = await db
    .query("submission")
    .withIndex("by_contest", (q: any) => q.eq("contestId", activeContest._id))
    .collect();
  
  return submissions;
}

/**
 * Mark contest as ready for judging
 */
export async function prepareContestForJudging(db: DatabaseWriter) {
  const submissions = await getCurrentContestSubmissions(db);
  
  // Get active contest for logging
  const activeContest = await db
    .query("contests")
    .withIndex("by_status", (q: any) => q.eq("status", "active"))
    .order("desc")
    .first();
  
  if (activeContest) {
    console.log(`Contest ${activeContest._id} ready for judging with ${submissions.length} submissions`);
  }
  
  // TODO: In the future, trigger automated testing here
  // TODO: Send notifications to judges
  
  return submissions;
}
