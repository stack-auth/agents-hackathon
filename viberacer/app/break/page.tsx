"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
import Link from "next/link";

export default function BreakPage() {
  const router = useRouter();
  const contestState = useQuery(api.race.getCurrentContestState);
  
  // Get the most recent completed contest for leaderboard
  const recentContests = useQuery(api.contests.getRecentContests, { limit: 1 });
  const latestContest = recentContests?.[0];
  
  const leaderboard = useQuery(
    api.leaderboard.getContestLeaderboard,
    latestContest ? { contestId: latestContest._id } : "skip"
  );
  
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
  
  // Get the winner from leaderboard
  const winner = leaderboard?.[0];
  
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-400 mb-4">
            CONTEST BREAK
          </h1>
          <p className="text-xl text-gray-500">
            Take a breather. Stretch. Hydrate.
          </p>
        </div>
        
        {/* Countdown */}
        <div className="text-center mb-12">
          <p className="text-gray-400 mb-2">Next contest starts in</p>
          <p className="text-6xl font-bold text-purple-400">
            {minutes}:{String(seconds).padStart(2, '0')}
          </p>
        </div>
        
        {/* Leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">
              🏆 LAST CONTEST RESULTS 🏆
            </h2>
            
            {/* Winner highlight */}
            {winner && (
              <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-600/20 border border-yellow-600/50 rounded-lg p-6 mb-8 text-center">
                <p className="text-lg text-yellow-400 mb-2">WINNER</p>
                <Link 
                  href={`/user/${winner.userId}`}
                  className="text-3xl font-bold text-white hover:text-yellow-400 transition-colors"
                >
                  {winner.displayName}
                </Link>
                <p className="text-xl text-gray-300 mt-2">
                  Score: {winner.score}
                </p>
              </div>
            )}
            
            {/* Full leaderboard */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Rank</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Player</th>
                    <th className="px-4 py-3 text-center text-sm text-gray-400">Score</th>
                    <th className="px-4 py-3 text-center text-sm text-gray-400">Submissions</th>
                    <th className="px-4 py-3 text-center text-sm text-gray-400">Reviews</th>
                    <th className="px-4 py-3 text-center text-sm text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {leaderboard.map((entry) => (
                    <tr key={entry.userId} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-lg font-bold ${
                          entry.rank === 1 ? "text-yellow-400" :
                          entry.rank === 2 ? "text-gray-300" :
                          entry.rank === 3 ? "text-orange-600" :
                          "text-gray-500"
                        }`}>
                          {entry.rank === 1 && "🥇 "}
                          {entry.rank === 2 && "🥈 "}
                          {entry.rank === 3 && "🥉 "}
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link 
                          href={`/user/${entry.userId}`}
                          className="text-white hover:text-purple-400 transition-colors"
                        >
                          {entry.displayName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-lg font-bold">{entry.score}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">
                        {entry.submissionCount}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">
                        {entry.reviewCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry.completedAllReviews ? (
                          <span className="text-green-400">✓ Complete</span>
                        ) : (
                          <span className="text-yellow-400">Partial</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Link to full leaderboards */}
            <div className="text-center mt-6">
              <Link 
                href="/leaderboards"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                View all past leaderboards →
              </Link>
            </div>
          </div>
        )}
        
        {/* Tips */}
        <div className="bg-gray-900 rounded-lg p-6 max-w-2xl mx-auto mb-8">
          <p className="text-sm text-gray-400 mb-3">While you wait:</p>
          <ul className="text-left space-y-2 text-sm text-gray-300">
            <li>• Review the leaderboard and learn from top submissions</li>
            <li>• Prepare your development environment</li>
            <li>• Think about different approaches for the next challenge</li>
            <li>• Get ready to code fast!</li>
          </ul>
        </div>
        
        {/* Navigation */}
        <div className="text-center space-y-4">
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