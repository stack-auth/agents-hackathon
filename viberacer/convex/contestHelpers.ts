import { DatabaseReader, DatabaseWriter } from "./_generated/server";

/**
 * Get the current contest ID based on when it started
 */
export function getCurrentContestId(): string {
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

/**
 * Get all submissions for the current contest
 */
export async function getCurrentContestSubmissions(db: DatabaseReader) {
  const contestId = getCurrentContestId();
  
  const submissions = await db
    .query("submissions")
    .withIndex("by_contest", q => q.eq("contestId", contestId))
    .collect();
  
  return submissions;
}

/**
 * Mark contest as ready for judging
 */
export async function prepareContestForJudging(db: DatabaseWriter) {
  const contestId = getCurrentContestId();
  const submissions = await getCurrentContestSubmissions(db);
  
  console.log(`Contest ${contestId} ready for judging with ${submissions.length} submissions`);
  
  // TODO: In the future, trigger automated testing here
  // TODO: Send notifications to judges
  
  return submissions;
}
