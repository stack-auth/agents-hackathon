"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const adminData = useQuery(api.adminData.getAdminData);
  const advanceStage = useMutation(api.race.advanceStage);
  const initMonitoring = useMutation(api.race.initializeMonitoring);
  const [, setTick] = useState(0);
  
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

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center font-mono">
      <div className="max-w-4xl w-full px-8">
        <h1 className="text-4xl font-bold text-black mb-8">
          ADMIN PANEL
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Control Panel */}
          <div className="space-y-6 bg-gray-50 p-8 border border-gray-200">
            <div>
              <p className="text-sm text-gray-600 mb-2">Current Stage</p>
              <p className="text-2xl font-bold text-black">{getStageInfo()}</p>
              {adminData?.wasSkipped && (
                <p className="text-sm text-orange-600 mt-1">⚠️ Stage was manually skipped</p>
              )}
            </div>
            
            {adminData && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Auto-advance in</p>
                <p className="text-xl font-mono text-black">
                  {Math.floor(adminData.timeToNext / 60)}:{String(Math.floor(adminData.timeToNext % 60)).padStart(2, '0')}
                </p>
                <p className="text-xs text-gray-500 mt-1">at {adminData.nextStageAt}</p>
              </div>
            )}
            
            <div className="space-y-3 pt-4">
              <button
                onClick={handleAdvance}
                className="w-full px-6 py-3 bg-black text-white hover:bg-gray-900 transition-colors"
              >
                ADVANCE TO: {getNextStage()}
              </button>
              
              <button
                onClick={handleInitMonitoring}
                className="w-full px-6 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors text-sm"
              >
                START MONITORING (if not running)
              </button>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Schedule</p>
              <div className="space-y-1 text-sm font-mono">
                <p>:05-:41 — Contest in progress</p>
                <p>:41-:01 — Judging stage 1</p>
                <p>:01-:02 — Judging stage 2</p>
                <p>:02-:03 — Judging stage 3</p>
                <p>:03-:05 — Break</p>
              </div>
            </div>
          </div>
          
          {/* System Information Panel */}
          <div className="space-y-6 bg-gray-50 p-8 border border-gray-200">
            <div>
              <p className="text-sm text-gray-600 mb-2">Monitoring System</p>
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
              <p className="text-sm text-gray-600 mb-2">Server Time</p>
              <p className="text-lg font-mono text-black">
                {adminData?.serverTimeLocal || "--:--:--"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {adminData?.serverTime || ""}
              </p>
            </div>
            
            {adminData?.recentWinners && adminData.recentWinners.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Recent Winners</p>
                <div className="space-y-1">
                  {adminData.recentWinners.map((winner, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-bold">{winner.name}</span>
                      <span className="text-gray-500 ml-2">{winner.contestHour}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Debug Info</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Active skip records: {adminData?.activeSkips || 0}</p>
                <p>Next stage timestamp: {adminData?.nextStageTimestamp || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <button
            onClick={() => router.push("/home")}
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            ← Back to homepage
          </button>
        </div>
      </div>
    </div>
  );
}
