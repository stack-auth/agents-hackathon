"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";

export default function JudgePage() {
  const router = useRouter();
  const user = useUser();
  const contestState = useQuery(api.race.getCurrentContestState);
  const judgingAssignments = useQuery(
    api.judging.getMyJudgingAssignments,
    user?.id ? { userId: user.id } : {}
  );
  const submitReview = useMutation(api.judging.submitReview);
  
  const [showModal, setShowModal] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState({
    themeRating: 5,
    designRating: 5,
    functionalityRating: 5,
  });
  const [submitting, setSubmitting] = useState(false);
  
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
  
  const handleSubmitRating = async () => {
    if (!user?.id || !judgingAssignments.assignments) return;
    
    const currentAssignment = judgingAssignments.assignments.filter(a => !a.completed)[currentIndex];
    if (!currentAssignment) return;
    
    setSubmitting(true);
    try {
      await submitReview({
        userId: user.id,
        submissionId: currentAssignment.submissionId,
        ...ratings,
      });
      
      // Move to next submission
      const remainingAssignments = judgingAssignments.assignments.filter(a => !a.completed);
      if (currentIndex < remainingAssignments.length - 1) {
        setCurrentIndex(currentIndex + 1);
        // Reset ratings for next submission
        setRatings({
          themeRating: 5,
          designRating: 5,
          functionalityRating: 5,
        });
      }
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
            No submissions were submitted for this contest.
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
  const completedCount = (judgingAssignments.assignments?.length || 0) - uncompletedAssignments.length;
  
  // All assignments completed or time ran out
  if (judgingAssignments.allCompleted || uncompletedAssignments.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-green-400">✓ Judging Complete!</h1>
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
  
  const currentAssignment = uncompletedAssignments[currentIndex];
  
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Modal */}
      {showModal && (
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
                  <li>• Judge fairly based on the three categories</li>
                  <li>• Each submission takes about 30-45 seconds to review</li>
                  <li>• The timer shows 55 seconds (5 second buffer for network lag)</li>
                </ul>
              </div>
              
              <div className="bg-black/50 p-4 rounded">
                <p className="font-bold mb-2">Rating Categories:</p>
                <ul className="space-y-1 text-sm">
                  <li>• <span className="text-purple-400">Theme:</span> How well does it match the vibe?</li>
                  <li>• <span className="text-purple-400">Design:</span> Visual appeal and user experience</li>
                  <li>• <span className="text-purple-400">Functionality:</span> Does it work? Is it complete?</li>
                </ul>
              </div>
              
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg font-bold text-lg"
              >
                Start Reviewing ({uncompletedAssignments.length} submissions)
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main judging interface */}
      {!showModal && currentAssignment && (
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">JUDGING - {getJudgingStage()}</h1>
              <p className="text-gray-400">
                Submission {completedCount + 1} of {judgingAssignments.assignments?.length || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Time remaining</p>
              <p className="text-2xl font-bold text-purple-400">
                {minutes}:{String(seconds).padStart(2, '0')}
              </p>
            </div>
          </div>
          
          {/* Submission viewer */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Iframe or submission preview */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-4 text-purple-400">Submission Preview</h2>
              <div className="bg-black rounded h-96 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="mb-2">Repository: {currentAssignment.submission?.repoId}</p>
                  <p className="text-xs">
                    (In production, this would show the actual submission)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Rating panel */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-lg font-bold mb-6 text-purple-400">Rate This Submission</h2>
              
              <div className="space-y-6">
                {/* Theme Rating */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Theme (How well does it match the vibe?)
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => setRatings({ ...ratings, themeRating: n })}
                        className={`w-10 h-10 rounded ${
                          ratings.themeRating >= n 
                            ? "bg-purple-600 text-white" 
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        } transition-colors`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Design Rating */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Design (Visual appeal and UX)
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => setRatings({ ...ratings, designRating: n })}
                        className={`w-10 h-10 rounded ${
                          ratings.designRating >= n 
                            ? "bg-purple-600 text-white" 
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        } transition-colors`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Functionality Rating */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Functionality (Does it work? Is it complete?)
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => setRatings({ ...ratings, functionalityRating: n })}
                        className={`w-10 h-10 rounded ${
                          ratings.functionalityRating >= n 
                            ? "bg-purple-600 text-white" 
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        } transition-colors`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Submit button */}
                <button
                  onClick={handleSubmitRating}
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors rounded-lg font-bold"
                >
                  {submitting ? "Submitting..." : 
                   currentIndex === uncompletedAssignments.length - 1 ? "Submit Final Review" : "Submit & Next"}
                </button>
                
                {/* Progress indicator */}
                <div className="pt-4 border-t border-gray-800">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{completedCount}/{judgingAssignments.assignments?.length || 0} completed</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 transition-all"
                      style={{ width: `${(completedCount / (judgingAssignments.assignments?.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
