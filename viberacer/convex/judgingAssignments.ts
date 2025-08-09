import { DatabaseWriter, DatabaseReader } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { 
  groupSubmissionsByScore, 
  getContestParticipants 
} from "./rankingCalculator";

/**
 * Assign submissions to judges for a specific judging stage
 */
export async function createJudgingAssignments(
  db: DatabaseWriter,
  contestId: Id<"contests">,
  stage: number
): Promise<void> {
  console.log(`Creating judging assignments for contest ${contestId}, stage ${stage}`);
  
  // Get all submissions for this contest
  const submissions = await db
    .query("submission")
    .withIndex("by_contest", (q: any) => q.eq("contestId", contestId))
    .collect();
  
  if (submissions.length === 0) {
    console.log("No submissions to assign");
    return;
  }
  
  // Get all participants (they are the judges)
  const participants = await getContestParticipants(db, contestId);
  
  if (stage === 1) {
    // Stage 1: Random assignment
    await createRandomAssignments(db, contestId, submissions, participants, stage);
  } else {
    // Stage 2 & 3: Group by similar scores from previous stage
    await createGroupedAssignments(db, contestId, submissions, participants, stage);
  }
}

/**
 * Create random assignments for stage 1
 */
async function createRandomAssignments(
  db: DatabaseWriter,
  contestId: Id<"contests">,
  submissions: any[],
  participants: string[],
  stage: number
): Promise<void> {
  const assignmentsPerJudge = 4;
  
  for (const judgeUserId of participants) {
    // Get submissions that are NOT from this judge
    const availableSubmissions = submissions.filter(s => s.userId !== judgeUserId);
    
    if (availableSubmissions.length === 0) continue;
    
    // Shuffle and pick up to 4 submissions
    const shuffled = [...availableSubmissions].sort(() => Math.random() - 0.5);
    const assigned = shuffled.slice(0, Math.min(assignmentsPerJudge, shuffled.length));
    
    // Create assignments
    for (const submission of assigned) {
      await db.insert("judgingAssignments", {
        contestId,
        judgeUserId,
        submissionId: submission._id,
        stage,
        completed: false,
        assignedAt: Date.now(),
      });
    }
    
    console.log(`Assigned ${assigned.length} submissions to judge ${judgeUserId} for stage ${stage}`);
  }
}

/**
 * Create assignments grouped by similar scores for stages 2 and 3
 */
async function createGroupedAssignments(
  db: DatabaseWriter,
  contestId: Id<"contests">,
  submissions: any[],
  participants: string[],
  stage: number
): Promise<void> {
  const previousStage = stage - 1;
  const assignmentsPerJudge = 4;
  
  // Group submissions by score from previous stage
  const groups = await groupSubmissionsByScore(db, contestId, previousStage);
  
  if (groups.length === 0) {
    // Fallback to random if no groups
    console.log("No score groups found, falling back to random assignment");
    await createRandomAssignments(db, contestId, submissions, participants, stage);
    return;
  }
  
  // Create a map of submission ID to submission data
  const submissionMap = new Map(submissions.map(s => [s._id, s]));
  
  // Assign judges to review submissions within the same score groups
  for (const judgeUserId of participants) {
    const assignments: Id<"submission">[] = [];
    
    // Find which group this judge's submission belongs to
    const judgeSubmission = submissions.find(s => s.userId === judgeUserId);
    if (!judgeSubmission) continue;
    
    // Find the group containing judge's submission
    let judgeGroup: Id<"submission">[] | undefined;
    for (const group of groups) {
      if (group.includes(judgeSubmission._id)) {
        judgeGroup = group;
        break;
      }
    }
    
    if (judgeGroup) {
      // Assign other submissions from the same group (not their own)
      const groupSubmissions = judgeGroup
        .filter(id => id !== judgeSubmission._id)
        .slice(0, assignmentsPerJudge);
      assignments.push(...groupSubmissions);
    }
    
    // If we need more assignments, get from nearby groups
    if (assignments.length < assignmentsPerJudge) {
      const remainingNeeded = assignmentsPerJudge - assignments.length;
      const allOtherSubmissions = submissions
        .filter(s => s.userId !== judgeUserId && !assignments.includes(s._id))
        .map(s => s._id);
      
      // Shuffle and add remaining
      const shuffled = [...allOtherSubmissions].sort(() => Math.random() - 0.5);
      assignments.push(...shuffled.slice(0, remainingNeeded));
    }
    
    // Create assignments in database
    for (const submissionId of assignments) {
      await db.insert("judgingAssignments", {
        contestId,
        judgeUserId,
        submissionId,
        stage,
        completed: false,
        assignedAt: Date.now(),
      });
    }
    
    console.log(`Assigned ${assignments.length} submissions to judge ${judgeUserId} for stage ${stage}`);
  }
}

/**
 * Get a user's judging assignments for current stage
 */
export async function getUserJudgingAssignments(
  db: DatabaseWriter | DatabaseReader,
  contestId: Id<"contests">,
  userId: string,
  stage: number
) {
  const assignments = await db
    .query("judgingAssignments")
    .withIndex("by_contest_judge_stage", (q: any) => 
      q.eq("contestId", contestId)
       .eq("judgeUserId", userId)
       .eq("stage", stage)
    )
    .collect();
  
  // Get submission details
  const assignmentsWithDetails = await Promise.all(
    assignments.map(async (assignment) => {
      const submission = await db.get(assignment.submissionId);
      return {
        ...assignment,
        submission,
      };
    })
  );
  
  return assignmentsWithDetails;
}

/**
 * Check if a user has completed all their judging assignments
 */
export async function hasCompletedJudging(
  db: DatabaseWriter | DatabaseReader,
  contestId: Id<"contests">,
  userId: string,
  stage: number
): Promise<boolean> {
  const assignments = await db
    .query("judgingAssignments")
    .withIndex("by_contest_judge_stage", (q: any) => 
      q.eq("contestId", contestId)
       .eq("judgeUserId", userId)
       .eq("stage", stage)
    )
    .collect();
  
  if (assignments.length === 0) return true; // No assignments means done
  
  return assignments.every(a => a.completed);
}