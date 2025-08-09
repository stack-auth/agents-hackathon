"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@stackframe/stack";

export default function HackPage() {
  const router = useRouter();
  const contestState = useQuery(api.race.getCurrentContestState);
  const user = useUser({ or: "redirect" });
  const mySubmission = useQuery(api.submissions.getMySubmission, { userId: user?.id || undefined });
  const submitUrl = useMutation(api.submissions.submitUrl);
  
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Update URL field if there's an existing submission
  useEffect(() => {
    if (mySubmission?.url && !url) {
      setUrl(mySubmission.url);
    }
  }, [mySubmission, url]);
  
  // Redirect if not in_progress
  useEffect(() => {
    if (contestState && contestState.stage !== "in_progress") {
      router.push("/compete");
    }
  }, [contestState, router]);
  
  // Redirect to auth if not authenticated
  useEffect(() => {
    if (user === null) {
      // User is not authenticated - redirect to sign in page
      router.push("/handler/sign-in");
    }
  }, [user, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);
    
    try {
      if (!user?.id) {
        throw new Error("Not authenticated");
      }
      const result = await submitUrl({ url, userId: user.id });
      setSuccess(true);
      if (result.updated) {
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit URL");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Show loading state
  if (!contestState || user === undefined) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }
  
  // Show auth required
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <div className="text-center">
          <p className="text-xl mb-4">Authentication required</p>
          <p className="text-gray-400">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }
  
  const timeRemaining = contestState.timeToNext;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">VIBERACER HACK MODE</h1>
          <div className="text-right">
            <p className="text-sm text-gray-400">Time remaining</p>
            <p className="text-2xl font-bold text-purple-400">
              {minutes}:{String(seconds).padStart(2, '0')}
            </p>
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Editor placeholder */}
          <div className="bg-gray-900 rounded-lg p-8 min-h-[500px]">
            <h2 className="text-xl font-bold mb-4 text-purple-400">Code Editor</h2>
            <div className="bg-black/50 rounded p-4 h-96 flex items-center justify-center text-gray-500">
              <p className="text-center">
                placeholder — insert vibecoding editor here
              </p>
            </div>
          </div>
          
          {/* Submission panel */}
          <div className="bg-gray-900 rounded-lg p-8">
            <h2 className="text-xl font-bold mb-4 text-purple-400">Submit Your Solution</h2>
            
            {mySubmission && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-600 rounded">
                <p className="text-sm text-green-400">
                  ✓ You have submitted a solution
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  You can update your submission until the contest ends
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Solution URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-black border border-gray-700 rounded focus:border-purple-500 focus:outline-none"
                  required
                  disabled={submitting}
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-900/30 border border-red-600 rounded">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="p-3 bg-green-900/30 border border-green-600 rounded">
                  <p className="text-sm text-green-400">
                    ✓ Submission {mySubmission ? 'updated' : 'received'} successfully!
                  </p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors rounded font-bold"
              >
                {submitting ? 'Submitting...' : mySubmission ? 'Update Submission' : 'Submit URL'}
              </button>
            </form>
            
            <div className="mt-8 p-4 bg-black/50 rounded">
              <h3 className="text-sm font-bold text-gray-400 mb-2">Contest Rules</h3>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Submit your solution URL before time runs out</li>
                <li>• You can update your submission any time during the contest</li>
                <li>• Only one submission per user per contest</li>
                <li>• Solutions will be judged after the contest ends</li>
              </ul>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => router.push("/home")}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                ← Back to home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
