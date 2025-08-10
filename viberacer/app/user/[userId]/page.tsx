"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const profile = useQuery(api.userProfile.getUserProfile, { userId });
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }
  
  // Create activity heatmap data structure
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Group activities by week for grid display
  const weeks: { date: Date; activity?: typeof profile.activityMap[0] }[][] = [];
  let currentWeek: { date: Date; activity?: typeof profile.activityMap[0] }[] = [];
  
  profile.activityMap.forEach((activity) => {
    const date = new Date(activity.date);
    const dayOfWeek = date.getDay();
    
    // Start new week on Sunday
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    // Fill empty days at start of first week
    if (weeks.length === 0 && currentWeek.length === 0) {
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({ 
          date: new Date(date.getTime() - (dayOfWeek - i) * 24 * 60 * 60 * 1000) 
        });
      }
    }
    
    currentWeek.push({ date, activity });
  });
  
  // Add last week if not empty
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  // Calculate stats
  const joinedDaysAgo = Math.floor((Date.now() - profile.firstSeen) / (1000 * 60 * 60 * 24));
  const winRate = profile.totalContests > 0 
    ? Math.round((profile.totalWins / profile.totalContests) * 100) 
    : 0;
  
  // Get activity intensity for cell coloring
  const getActivityColor = (activity?: typeof profile.activityMap[0]) => {
    if (!activity || !activity.participated) return "bg-gray-900";
    if (activity.won) return "bg-yellow-500";
    const score = activity.score || 0;
    if (score >= 8) return "bg-purple-500";
    if (score >= 6) return "bg-purple-400";
    if (score >= 4) return "bg-purple-300";
    return "bg-purple-200";
  };
  
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/home"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to home
          </Link>
        </div>
        
        {/* Profile Header */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{profile.displayName}</h1>
              <p className="text-gray-400">
                Joined {joinedDaysAgo} days ago
              </p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold text-purple-400">{profile.totalWins}</p>
              <p className="text-gray-400">Total Wins</p>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-black/50 rounded p-4">
              <p className="text-2xl font-bold">{profile.totalContests}</p>
              <p className="text-gray-400 text-sm">Contests Entered</p>
            </div>
            <div className="bg-black/50 rounded p-4">
              <p className="text-2xl font-bold">{winRate}%</p>
              <p className="text-gray-400 text-sm">Win Rate</p>
            </div>
            <div className="bg-black/50 rounded p-4">
              <p className="text-2xl font-bold">{profile.averageScore.toFixed(1)}</p>
              <p className="text-gray-400 text-sm">Average Score</p>
            </div>
            <div className="bg-black/50 rounded p-4">
              <p className="text-2xl font-bold">{profile.totalReviews}</p>
              <p className="text-gray-400 text-sm">Reviews Given</p>
            </div>
          </div>
        </div>
        
        {/* Activity Heatmap */}
        <div className="bg-gray-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Contest Activity</h2>
          
          {/* Legend */}
          <div className="flex items-center gap-4 mb-6 text-sm">
            <span className="text-gray-400">Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-gray-900 rounded"></div>
              <div className="w-4 h-4 bg-purple-200 rounded"></div>
              <div className="w-4 h-4 bg-purple-300 rounded"></div>
              <div className="w-4 h-4 bg-purple-400 rounded"></div>
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            </div>
            <span className="text-gray-400">More</span>
            <span className="text-yellow-400 ml-4">🏆 = Won</span>
          </div>
          
          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="inline-block">
              {/* Month labels */}
              <div className="flex mb-2">
                <div className="w-12"></div>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = new Date();
                  month.setMonth(month.getMonth() - 11 + i);
                  return (
                    <div key={i} className="flex-1 text-xs text-gray-400 px-1">
                      {months[month.getMonth()]}
                    </div>
                  );
                })}
              </div>
              
              {/* Days grid */}
              <div className="flex">
                {/* Day labels */}
                <div className="flex flex-col gap-1 mr-2">
                  <div className="h-3 text-xs text-gray-400"></div>
                  <div className="h-3 text-xs text-gray-400">Mon</div>
                  <div className="h-3 text-xs text-gray-400"></div>
                  <div className="h-3 text-xs text-gray-400">Wed</div>
                  <div className="h-3 text-xs text-gray-400"></div>
                  <div className="h-3 text-xs text-gray-400">Fri</div>
                  <div className="h-3 text-xs text-gray-400"></div>
                </div>
                
                {/* Activity cells */}
                <div className="flex gap-1">
                  {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-1">
                      {week.map((day, dayIdx) => (
                        <div
                          key={dayIdx}
                          className={`w-3 h-3 rounded-sm ${getActivityColor(day.activity)} relative group`}
                          title={day.activity ? 
                            `${day.date.toLocaleDateString()}: ${
                              day.activity.won ? "🏆 Won! " : ""
                            }Score: ${day.activity.score || "N/A"}` 
                            : day.date.toLocaleDateString()
                          }
                        >
                          {day.activity?.won && (
                            <span className="absolute -top-1 -left-1 text-[8px]">🏆</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-400">
              {profile.totalContests} total contributions in the last year
            </p>
          </div>
        </div>
        
        {/* Recent Contests */}
        <div className="mt-8 bg-gray-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Recent Performance</h2>
          <div className="space-y-4">
            {profile.activityMap
              .filter(a => a.participated)
              .slice(-5)
              .reverse()
              .map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between bg-black/50 rounded p-4">
                  <div className="flex items-center gap-4">
                    {activity.won && <span className="text-2xl">🏆</span>}
                    <div>
                      <p className="font-bold">{new Date(activity.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-400">
                        Score: {activity.score?.toFixed(1) || "N/A"}
                      </p>
                    </div>
                  </div>
                  {activity.contestId && (
                    <Link
                      href={`/contest/${activity.contestId}`}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      View Contest →
                    </Link>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}