"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
import { createRepo } from "@/lib/create-repo";

export default function CompetePage() {
  const router = useRouter();
  const contestState = useQuery(api.race.getCurrentContestState);

  const createRepoAndRedirect = async () => {
    const repoId = await createRepo();
    router.push(`/hack/${repoId}`);
  }
  
  // Redirect to /compete/{repoId} if in_progress
  useEffect(() => {
    if (contestState && contestState.stage === "in_progress") {
      createRepoAndRedirect();
    }
  }, [contestState, router]);

  if (contestState && contestState.stage === "in_progress") {
    return <div>Creating repo...</div>
  }
  
  const getStageDisplay = () => {
    if (!contestState) return { title: "Loading...", message: "" };
    
    switch (contestState.stage) {
      case "judging_1":
      case "judging_2":
      case "judging_3":
        return {
          title: "Judging in Progress",
          message: "Solutions are being evaluated. Results coming soon!"
        };
      case "break":
        return {
          title: "Contest Break",
          message: "Next contest starts at the top of the hour"
        };
      default:
        return {
          title: "Contest Status",
          message: ""
        };
    }
  };
  
  const stageInfo = getStageDisplay();
  const timeToNext = contestState?.timeToNext || 0;
  const minutes = Math.floor(timeToNext / 60);
  const seconds = timeToNext % 60;
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
      <div className="text-center space-y-6 max-w-2xl px-8">
        <h1 className="text-5xl font-bold text-purple-400">
          {stageInfo.title}
        </h1>
        
        {stageInfo.message && (
          <p className="text-xl text-gray-300">
            {stageInfo.message}
          </p>
        )}
        
        <div className="py-8">
          <p className="text-gray-400 mb-2">Next contest starts in</p>
          <p className="text-6xl font-bold">
            {minutes}:{String(seconds).padStart(2, '0')}
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => router.push("/home")}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg font-bold"
          >
            Back to Home
          </button>
          
          <p className="text-sm text-gray-500">
            Contest runs from :05 to :41 every hour
          </p>
        </div>
      </div>
    </div>
  );
}