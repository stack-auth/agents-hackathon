"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function LeaderboardsPage() {
  const router = useRouter();
  const [selectedContest, setSelectedContest] = useState<string | null>(null);
  
  // Get recent contests
  const recentContests = useQuery(api.contests.getRecentContests, { limit: 50 });
  
  // Get leaderboard for selected contest
  const leaderboard = useQuery(
    api.leaderboard.getContestLeaderboard,
    selectedContest ? { contestId: selectedContest as any } : "skip"
  );
  
  // Get weekly top winners
  const weeklyTopWinners = useQuery(api.leaderboard.getWeeklyTopWinners, {});
  
  // Get recent winners
  const recentWinners = useQuery(api.leaderboard.getRecentWinners, { limit: 10 });
  
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/home"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to home
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-8 text-center">
          🏆 LEADERBOARDS 🏆
        </h1>
        
        {/* Top Stats */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Weekly Top Winners */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">
              Top Winners This Week
            </h2>
            {weeklyTopWinners && weeklyTopWinners.length > 0 ? (
              <div className="space-y-4">
                {weeklyTopWinners.map((winner, idx) => {
                  const emoji = idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉';
                  return (
                    <div key={idx} className="flex items-center justify-between bg-black/50 rounded p-4">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{emoji}</span>
                        <Link 
                          href={`/user/${winner.userId}`}
                          className="text-xl font-bold hover:text-purple-400 transition-colors"
                        >
                          {winner.name}
                        </Link>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-400">{winner.wins}</p>
                        <p className="text-sm text-gray-400">wins</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400">No winners yet this week</p>
            )}
          </div>
          
          {/* Recent Winners */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">
              Recent Contest Winners
            </h2>
            {recentWinners && recentWinners.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentWinners.map((winner, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-black/50 rounded p-3">
                    <Link 
                      href={`/user/${winner.userId}`}
                      className="font-bold hover:text-purple-400 transition-colors"
                    >
                      {winner.name}
                    </Link>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">{winner.contestHour}</span>
                      <span className="text-purple-400">Score: {winner.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No recent winners</p>
            )}
          </div>
        </div>
        
        {/* Contest Selector */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">View Contest Results</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Select a contest to view its leaderboard
              </label>
              <select
                value={selectedContest || ""}
                onChange={(e) => setSelectedContest(e.target.value || null)}
                className="w-full bg-black border border-gray-700 rounded px-4 py-2 text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="">Choose a contest...</option>
                {recentContests?.map((contest) => {
                  const date = new Date(contest.actualTimestamp);
                  const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <option key={contest._id} value={contest._id}>
                      {formattedDate} - {contest.status === "active" ? "🔴 LIVE" : "Completed"}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex items-end">
              {selectedContest && (
                <button
                  onClick={() => setSelectedContest(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Selected Contest Leaderboard */}
        {selectedContest && leaderboard && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="bg-gray-800 px-6 py-4">
              <h2 className="text-2xl font-bold">Contest Leaderboard</h2>
              {recentContests && (
                <p className="text-gray-400 text-sm mt-1">
                  {(() => {
                    const contest = recentContests.find(c => c._id === selectedContest);
                    if (!contest) return "";
                    const date = new Date(contest.actualTimestamp);
                    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  })()}
                </p>
              )}
            </div>
            
            {leaderboard.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm text-gray-400">Rank</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-400">Player</th>
                    <th className="px-6 py-3 text-center text-sm text-gray-400">Score</th>
                    <th className="px-6 py-3 text-center text-sm text-gray-400">Submissions</th>
                    <th className="px-6 py-3 text-center text-sm text-gray-400">Reviews</th>
                    <th className="px-6 py-3 text-center text-sm text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {leaderboard.map((entry) => (
                    <tr key={entry.userId} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
                        <Link 
                          href={`/user/${entry.userId}`}
                          className="text-white hover:text-purple-400 transition-colors font-bold"
                        >
                          {entry.displayName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold">{entry.score}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-400">
                        {entry.submissionCount}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-400">
                        {entry.reviewCount}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {entry.completedAllReviews ? (
                          <span className="text-green-400">✓ Qualified</span>
                        ) : (
                          <span className="text-red-400">Disqualified (0 pts)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-400">
                No participants qualified for this contest (minimum 5 reviews required)
              </div>
            )}
          </div>
        )}
        
        {/* Stats Summary */}
        <div className="mt-12 bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Contest Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/50 rounded p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {recentContests?.filter(c => c.status === "completed").length || 0}
              </p>
              <p className="text-sm text-gray-400">Completed Contests</p>
            </div>
            <div className="bg-black/50 rounded p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {weeklyTopWinners?.[0]?.wins || 0}
              </p>
              <p className="text-sm text-gray-400">Max Weekly Wins</p>
            </div>
            <div className="bg-black/50 rounded p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {recentWinners?.[0]?.score || 0}
              </p>
              <p className="text-sm text-gray-400">Highest Recent Score</p>
            </div>
            <div className="bg-black/50 rounded p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">24</p>
              <p className="text-sm text-gray-400">Contests Per Day</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}