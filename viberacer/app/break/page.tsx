"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export default function BreakPage() {
  const router = useRouter();
  const contestState = useQuery(api.race.getCurrentContestState);
  const recentWinners = useQuery(api.winners.getRecentWinners);
  
  // Redirect if not in break
  useEffect(() => {
    if (contestState && contestState.stage !== "break") {
      router.push("/compete");
    }
  }, [contestState, router]);
  
  if (!contestState) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }
  
  const timeRemaining = contestState.timeToNext;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  // Get the latest winner if available
  const latestWinner = recentWinners?.[0];
  
  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center">
      <div className="text-center space-y-8 max-w-4xl px-8">
        {/* Winner announcement if available */}
        {latestWinner && (
          <div className="mb-12 animate-pulse">
            <p className="text-2xl text-purple-400 mb-4">🏆 WINNER 🏆</p>
            <p className="text-5xl font-bold text-white mb-2">
              {latestWinner.name}
            </p>
            <p className="text-xl text-gray-400">
              {latestWinner.contestHour} contest
            </p>
            {latestWinner.score && (
              <p className="text-lg text-purple-300 mt-2">
                Score: {latestWinner.score}
              </p>
            )}
          </div>
        )}
        
        {/* Break message */}
        <div>
          <h1 className="text-4xl font-bold text-gray-400 mb-4">
            CONTEST BREAK
          </h1>
          <p className="text-xl text-gray-500">
            Take a breather. Stretch. Hydrate.
          </p>
        </div>
        
        {/* Countdown */}
        <div className="py-8">
          <p className="text-gray-400 mb-2">Next contest starts in</p>
          <p className="text-6xl font-bold text-purple-400">
            {minutes}:{String(seconds).padStart(2, '0')}
          </p>
        </div>
        
        {/* Tips */}
        <div className="bg-gray-900 rounded-lg p-6 max-w-2xl">
          <p className="text-sm text-gray-400 mb-3">While you wait:</p>
          <ul className="text-left space-y-2 text-sm text-gray-300">
            <li>• Review the previous solutions</li>
            <li>• Prepare your development environment</li>
            <li>• Think about different approaches</li>
            <li>• Get ready to code fast!</li>
          </ul>
        </div>
        
        {/* Navigation */}
        <div className="space-y-4">
          <button
            onClick={() => router.push("/home")}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg font-bold"
          >
            Back to Home
          </button>
          
          <p className="text-xs text-gray-600">
            Contests run every hour from :05 to :00
          </p>
        </div>
      </div>
    </div>
  );
}