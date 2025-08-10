"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";
import FreestylePreview from "@/components/FreestylePreview";

// Star rating component
function StarRating({ 
  value, 
  onChange, 
  label 
}: { 
  value: number; 
  onChange: (value: number) => void; 
  label: string;
}) {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-300">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star * 2)} // Convert to 1-10 scale
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-3xl transition-colors focus:outline-none"
          >
            <span 
              className={
                (hover ? star <= hover : star * 2 <= value) 
                  ? "text-yellow-400" 
                  : "text-gray-600"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function JudgePage() {
  const router = useRouter();
  const user = useUser();
  const contestState = useQuery(api.race.getCurrentContestState);
  const judgingAssignments = useQuery(
    api.judging.getMyJudgingAssignments,
    user?.id ? { userId: user.id } : {}
  );
  const submitReview = useMutation(api.judging.submitReview);
  
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState<number | null>(null);
  const [ratings, setRatings] = useState({
    themeRating: 6,
    designRating: 6,
    functionalityRating: 6,
  });
  const [submitting, setSubmitting] = useState(false);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set());
  
  // Redirect if not in judging phase
  useEffect(() => {
    if (contestState && !["judging_1", "judging_2", "judging_3"].includes(contestState.stage)) {
      router.push("/compete");
    }
  }, [contestState, router]);
  
  // Redirect if user is not authenticated
  useEffect(() => {
    if (user === null) {
      router.push("/handler/sign-in");
    }
  }, [user, router]);
  
  if (!contestState || !user || !judgingAssignments) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }
  
  // Show 55 seconds on client (5 second buffer for lag)
  const timeRemaining = Math.max(0, contestState.timeToNext - 5);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  const getJudgingStage = () => {
    switch (contestState.stage) {
      case "judging_1":
        return "Round 1";
      case "judging_2":
        return "Round 2";
      case "judging_3":
        return "Final Round";
      default:
        return "Judging";
    }
  };
  
  const handleOpenRatingDialog = (index: number) => {
    setSelectedSubmissionIndex(index);
    setRatings({
      themeRating: 6,
      designRating: 6,
      functionalityRating: 6,
    });
    setShowRatingDialog(true);
  };
  
  const handleSubmitRating = async () => {
    if (!user?.id || !judgingAssignments.assignments || selectedSubmissionIndex === null) return;
    
    const assignment = judgingAssignments.assignments.filter(a => !a.completed)[selectedSubmissionIndex];
    if (!assignment) return;
    
    setSubmitting(true);
    try {
      await submitReview({
        userId: user.id,
        submissionId: assignment.submissionId,
        ...ratings,
      });
      
      // Mark as completed
      setCompletedIndices(prev => new Set([...prev, selectedSubmissionIndex]));
      setShowRatingDialog(false);
      setSelectedSubmissionIndex(null);
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Check if user has a submission
  if (!judgingAssignments.hasSubmission) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-red-400">No Submission Found</h1>
          <p className="text-gray-300">
            No submissions found. Please wait until this round ends.
          </p>
          <button
            onClick={() => router.push("/home")}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  const uncompletedAssignments = judgingAssignments.assignments?.filter(a => !a.completed) || [];
  const completedCount = (judgingAssignments.assignments?.length || 0) - uncompletedAssignments.length + completedIndices.size;
  
  // All assignments completed
  if (judgingAssignments.allCompleted || (uncompletedAssignments.length === completedIndices.size && completedIndices.size > 0)) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-green-400">✓ All Reviews Complete!</h1>
          <p className="text-xl text-gray-300">
            Thank you for reviewing {completedCount} submission{completedCount !== 1 ? 's' : ''}. 
          </p>
          <div className="py-4">
            <p className="text-gray-400 mb-2">Next stage in</p>
            <p className="text-4xl font-bold text-purple-400">
              {minutes}:{String(seconds).padStart(2, '0')}
            </p>
          </div>
          <button
            onClick={() => router.push("/home")}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white font-mono p-4">
      {/* Intro Modal */}
      {showIntroModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-purple-600 rounded-lg p-8 max-w-2xl">
            <h2 className="text-3xl font-bold mb-4 text-purple-400">
              {getJudgingStage()} - Peer Review
            </h2>
            
            <div className="space-y-4 text-gray-300">
              <p className="text-lg">
                You have <span className="text-purple-400 font-bold">{minutes}:{String(seconds).padStart(2, '0')}</span> to 
                review <span className="text-purple-400 font-bold">{uncompletedAssignments.length}</span> submissions.
              </p>
              
              <div className="bg-black/50 p-4 rounded">
                <p className="font-bold mb-2 text-yellow-400">⚠️ IMPORTANT:</p>
                <ul className="space-y-1 text-sm">
                  <li>• You MUST complete all reviews or your submission will be <span className="text-red-400">INVALID</span></li>
                  <li>• Click on each submission to rate it</li>
                  <li>• Use the star ratings (1-5 stars) for each category</li>
                  <li>• Judge fairly and quickly - time is limited!</li>
                </ul>
              </div>
              
              <button
                onClick={() => setShowIntroModal(false)}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg font-bold text-lg"
              >
                Start Reviewing
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Interface */}
      {!showIntroModal && (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">JUDGING - {getJudgingStage()}</h1>
              <p className="text-gray-400">
                {completedCount} of {judgingAssignments.assignments?.length || 0} reviewed
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Time remaining</p>
              <p className="text-3xl font-bold text-purple-400">
                {minutes}:{String(seconds).padStart(2, '0')}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                style={{ width: `${(completedCount / (judgingAssignments.assignments?.length || 1)) * 100}%` }}
              />
            </div>
          </div>
          
          {/* 2x2 Grid of Submissions */}
          <div className="grid grid-cols-2 gap-4">
            {uncompletedAssignments.map((assignment, index) => {
              const isCompleted = completedIndices.has(index);
              return (
                <div
                  key={assignment.submissionId}
                  className={`relative bg-gray-900 rounded-lg overflow-hidden border-2 transition-all ${
                    isCompleted 
                      ? 'border-green-500 opacity-50' 
                      : 'border-gray-700 hover:border-purple-500 cursor-pointer'
                  }`}
                  onClick={() => !isCompleted && handleOpenRatingDialog(index)}
                >
                  {/* Submission Preview */}
                  <div className="aspect-video bg-black/50 relative overflow-hidden">
                    {assignment.submission?.repoId ? (
                      <FreestylePreview 
                        repoId={assignment.submission.repoId} 
                        className="absolute inset-0 w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Loading submission...</p>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs">
                      Submission #{index + 1}
                    </div>
                  </div>
                  
                  {/* Status Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    {isCompleted ? (
                      <div className="flex items-center justify-center text-green-400">
                        <span className="text-2xl mr-2">✓</span>
                        <span className="font-bold">Reviewed</span>
                      </div>
                    ) : (
                      <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 transition-colors rounded font-bold">
                        RATE THIS
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Quick Stats */}
          <div className="mt-6 flex justify-center space-x-8 text-sm text-gray-400">
            <div>Remaining: {uncompletedAssignments.length - completedIndices.size}</div>
            <div>Completed: {completedCount}</div>
            <div>Total: {judgingAssignments.assignments?.length || 0}</div>
          </div>
        </div>
      )}
      
      {/* Rating Dialog */}
      {showRatingDialog && selectedSubmissionIndex !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-purple-600 rounded-lg p-8 max-w-4xl w-full">
            <h3 className="text-2xl font-bold mb-6 text-purple-400">
              Rate Submission #{selectedSubmissionIndex + 1}
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Preview */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                {uncompletedAssignments[selectedSubmissionIndex]?.submission?.repoId ? (
                  <FreestylePreview 
                    repoId={uncompletedAssignments[selectedSubmissionIndex].submission.repoId} 
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Loading submission...</p>
                  </div>
                )}
              </div>
              
              {/* Rating Controls */}
              <div className="space-y-6">
              <StarRating
                value={ratings.themeRating}
                onChange={(value) => setRatings({ ...ratings, themeRating: value })}
                label="Theme - How well does it match the vibe?"
              />
              
              <StarRating
                value={ratings.designRating}
                onChange={(value) => setRatings({ ...ratings, designRating: value })}
                label="Design - Visual appeal and user experience"
              />
              
              <StarRating
                value={ratings.functionalityRating}
                onChange={(value) => setRatings({ ...ratings, functionalityRating: value })}
                label="Functionality - Does it work? Is it complete?"
              />
              
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowRatingDialog(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 transition-colors rounded-lg font-bold"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors rounded-lg font-bold"
                >
                  {submitting ? "Submitting..." : "Submit Rating"}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
