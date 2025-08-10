"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";

export default function AdminPage() {
  const router = useRouter();
  const adminData = useQuery(api.adminData.getAdminData);
  const systemStats = useQuery(api.admin.getSystemStats);
  const allContests = useQuery(api.admin.getAllContests);
  const recentActivity = useQuery(api.admin.getRecentActivity, { limit: 20 });
  const userStats = useQuery(api.admin.getUserStats, {});
  const judgingStats = useQuery(api.judging.getJudgingStats, {});
  const advanceStage = useMutation(api.race.advanceStage);
  const initMonitoring = useMutation(api.race.initializeMonitoring);
  
  const [selectedContestId, setSelectedContestId] = useState<Id<"contests"> | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "contests" | "users" | "activity">("overview");
  const [, setTick] = useState(0);
  
  const contestDetails = useQuery(
    api.admin.getContestDetails,
    selectedContestId ? { contestId: selectedContestId } : "skip"
  );
  
  // Update every second to refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAdvance = async () => {
    await advanceStage();
  };
  
  const handleInitMonitoring = async () => {
    await initMonitoring();
  };

  const getStageInfo = () => {
    if (!adminData) return "Loading...";
    
    const stageNames = {
      in_progress: "Contest In Progress",
      judging_1: "Judging - Stage 1",
      judging_2: "Judging - Stage 2",
      judging_3: "Judging - Stage 3",
      break: "Break",
    };
    
    return stageNames[adminData.currentStage as keyof typeof stageNames] || adminData.currentStage;
  };

  const getNextStage = () => {
    if (!adminData) return "";
    
    const stageNames = {
      in_progress: "Contest In Progress",
      judging_1: "Judging - Stage 1",
      judging_2: "Judging - Stage 2",
      judging_3: "Judging - Stage 3",
      break: "Break",
    };
    
    return stageNames[adminData.nextStage as keyof typeof stageNames] || adminData.nextStage;
  };
  
  const getHealthColor = () => {
    if (!adminData) return "text-gray-500";
    switch (adminData.monitoringHealth) {
      case "Healthy": return "text-green-600";
      case "Warning - Slow": return "text-yellow-600";
      case "Error - Stopped": return "text-red-600";
      default: return "text-gray-500";
    }
  };
  
  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString();
  };
  
  const formatDuration = (start: number, end?: number) => {
    const duration = (end || Date.now()) - start;
    const minutes = Math.floor(duration / 60000);
    return `${minutes} min`;
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 font-mono">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-black">ADMIN DASHBOARD</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push("/leaderboards")}
              className="text-sm text-purple-600 hover:text-purple-800 font-bold transition-colors"
            >
              View Leaderboards →
            </button>
            <button
              onClick={() => router.push("/home")}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              ← Back to homepage
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-white border border-gray-200">
          {(["overview", "contests", "users", "activity"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 capitalize transition-colors ${
                activeTab === tab 
                  ? "bg-black text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* System Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Total Contests</p>
                <p className="text-2xl font-bold">{systemStats?.totalContests || 0}</p>
              </div>
              <div className="bg-white p-4 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Total Submissions</p>
                <p className="text-2xl font-bold">{systemStats?.totalSubmissions || 0}</p>
              </div>
              <div className="bg-white p-4 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Total Reviews</p>
                <p className="text-2xl font-bold">{systemStats?.totalReviews || 0}</p>
              </div>
              <div className="bg-white p-4 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Unique Users</p>
                <p className="text-2xl font-bold">{systemStats?.uniqueUsers || 0}</p>
              </div>
              <div className="bg-white p-4 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Unique Users</p>
                <p className="text-2xl font-bold">{systemStats?.uniqueUsers || 0}</p>
              </div>
            </div>
            
            {/* Control Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Control Panel */}
              <div className="bg-white p-6 border border-gray-200">
                <h2 className="text-lg font-bold mb-4">Stage Control</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Stage</p>
                    <p className="text-xl font-bold">{getStageInfo()}</p>
                    {adminData?.wasSkipped && (
                      <p className="text-sm text-orange-600 mt-1">⚠️ Stage was manually skipped</p>
                    )}
                  </div>
                  
                  {adminData && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Auto-advance in</p>
                      <p className="text-lg font-mono">
                        {Math.floor(adminData.timeToNext / 60)}:{String(Math.floor(adminData.timeToNext % 60)).padStart(2, '0')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">at {adminData.nextStageAt}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2 pt-4">
                    <button
                      onClick={handleAdvance}
                      className="w-full px-4 py-2 bg-black text-white hover:bg-gray-900 transition-colors"
                    >
                      ADVANCE TO: {getNextStage()}
                    </button>
                    
                    <button
                      onClick={handleInitMonitoring}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors text-sm"
                    >
                      START MONITORING
                    </button>
                  </div>
                </div>
              </div>
              
              {/* System Health Panel */}
              <div className="bg-white p-6 border border-gray-200">
                <h2 className="text-lg font-bold mb-4">System Health</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Monitoring Status</p>
                    <p className={`text-lg font-bold ${getHealthColor()}`}>
                      {adminData?.monitoringHealth || "Unknown"}
                    </p>
                    {adminData?.lastCheckAgo !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last check: {adminData?.lastCheckAgo}s ago
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Server Time</p>
                    <p className="text-lg font-mono">
                      {adminData?.serverTimeLocal || "--:--:--"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Contest</p>
                    <p className="text-sm font-mono">
                      {systemStats?.activeContestId || "None"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Judging Stats Panel */}
            {judgingStats && (
              <div className="bg-white p-6 border border-gray-200">
                <h2 className="text-lg font-bold mb-4">Current Judging Status</h2>
                <div className="space-y-4">
                  {judgingStats.stats.map(stage => (
                    <div key={stage.stage} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Stage {stage.stage}</span>
                        <span className="text-sm text-gray-600">
                          {stage.completedAssignments}/{stage.totalAssignments} completed
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-600 transition-all"
                          style={{ width: `${stage.completionRate}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {stage.completionRate}% complete • {stage.uniqueJudges} judges
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200 text-sm">
                    <p>Total Assignments: {judgingStats.totalAssignments}</p>
                    <p>Total Completed: {judgingStats.totalCompleted}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Contests Tab */}
        {activeTab === "contests" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold">All Contests</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Started</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Duration</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Submissions</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Reviews</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Participants</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Winner</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allContests?.map((contest) => (
                      <tr key={contest._id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-xs font-mono">{contest._id.slice(-8)}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            contest.status === "active" ? "bg-green-100 text-green-800" :
                            contest.status === "completed" ? "bg-gray-100 text-gray-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {contest.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs">{contest.type}</td>
                        <td className="px-4 py-2 text-xs">{formatTimestamp(contest.actualTimestamp)}</td>
                        <td className="px-4 py-2 text-xs">
                          {contest.endTimestamp ? formatDuration(contest.actualTimestamp, contest.endTimestamp) : "Ongoing"}
                        </td>
                        <td className="px-4 py-2 text-xs text-center">{contest.submissionCount}</td>
                        <td className="px-4 py-2 text-xs text-center">{contest.reviewCount}</td>
                        <td className="px-4 py-2 text-xs text-center">{contest.participants}</td>
                        <td className="px-4 py-2 text-xs">
                          {contest.winner ? (
                            <div>
                              <span className="font-bold">{contest.winner.displayName}</span>
                              <span className="text-gray-500 ml-1">({contest.winner.score})</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => setSelectedContestId(contest._id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Contest Details Modal */}
            {selectedContestId && contestDetails && (
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Contest Details: {selectedContestId.slice(-8)}</h3>
                  <button
                    onClick={() => setSelectedContestId(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-600">Total Submissions</p>
                    <p className="text-xl font-bold">{contestDetails.totalSubmissions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Reviews</p>
                    <p className="text-xl font-bold">{contestDetails.totalReviews}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Unique Participants</p>
                    <p className="text-xl font-bold">{contestDetails.uniqueParticipants}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Unique Reviewers</p>
                    <p className="text-xl font-bold">{contestDetails.uniqueReviewers}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Submissions</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {contestDetails.submissions.map((sub) => (
                      <div key={sub._id} className="bg-gray-50 p-3 text-xs">
                        <div className="flex justify-between">
                          <span className="font-mono">User: {sub.userId.slice(0, 12)}</span>
                          <span>Reviews: {sub.reviews.length}</span>
                          {sub.avgRating && (
                            <span>Avg Rating: {sub.avgRating.toFixed(1)}</span>
                          )}
                        </div>
                        <div className="text-gray-600 mt-1">
                          Repo: {sub.repoId}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold">User Participation Stats</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">User ID</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Submissions</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Reviews</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Contests</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userStats?.slice(0, 50).map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs font-mono">{user.userId}</td>
                      <td className="px-4 py-2 text-xs text-center">{user.submissions}</td>
                      <td className="px-4 py-2 text-xs text-center">{user.reviews}</td>
                      <td className="px-4 py-2 text-xs text-center">{user.contestCount}</td>
                      <td className="px-4 py-2 text-xs">{formatTimestamp(user.lastActive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold">Recent Activity</h2>
            </div>
            <div className="p-4 space-y-2">
              {recentActivity?.map((activity, idx) => (
                <div key={idx} className="flex items-center space-x-4 py-2 border-b border-gray-100 text-xs">
                  <span className={`px-2 py-1 rounded ${
                    activity.type === "submission" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                  }`}>
                    {activity.type}
                  </span>
                  <span className="font-mono">{activity.userId.slice(0, 12)}</span>
                  <span className="text-gray-600">{formatTimestamp(activity.timestamp)}</span>
                  {activity.type === "review" && (
                    <span className="text-gray-600">Avg Rating: {(activity as any).avgRating?.toFixed(1)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}