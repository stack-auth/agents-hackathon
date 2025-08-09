"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export default function JudgePage() {
  const router = useRouter();
  const contestState = useQuery(api.race.getCurrentContestState);
  
  // Redirect if not in judging phase
  useEffect(() => {
    if (contestState && !["judging_1", "judging_2", "judging_3"].includes(contestState.stage)) {
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
  
  const getJudgingStage = () => {
    switch (contestState.stage) {
      case "judging_1":
        return "Stage 1: Initial Review";
      case "judging_2":
        return "Stage 2: Code Analysis";
      case "judging_3":
        return "Stage 3: Final Scoring";
      default:
        return "Judging";
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">VIBERACER JUDGING</h1>
          <div className="text-right">
            <p className="text-sm text-gray-400">Time to next stage</p>
            <p className="text-2xl font-bold text-purple-400">
              {minutes}:{String(seconds).padStart(2, '0')}
            </p>
          </div>
        </div>
        
        {/* Main content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">
              {getJudgingStage()}
            </h2>
            
            <div className="space-y-4">
              <div className="bg-black/50 rounded p-6">
                <p className="text-lg text-gray-300 mb-4">
                  Solutions are being evaluated by our AI judges...
                </p>
                
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse space-y-3">
                    <div className="h-2 w-64 bg-purple-600 rounded"></div>
                    <div className="h-2 w-48 bg-purple-600 rounded"></div>
                    <div className="h-2 w-56 bg-purple-600 rounded"></div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 text-center">
                  Analyzing creativity, code quality, and execution...
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className={`p-4 rounded-lg text-center ${
                  contestState.stage === "judging_1" ? "bg-purple-600" : "bg-gray-800"
                }`}>
                  <p className="font-bold">Stage 1</p>
                  <p className="text-sm text-gray-300">Initial Review</p>
                </div>
                <div className={`p-4 rounded-lg text-center ${
                  contestState.stage === "judging_2" ? "bg-purple-600" : "bg-gray-800"
                }`}>
                  <p className="font-bold">Stage 2</p>
                  <p className="text-sm text-gray-300">Code Analysis</p>
                </div>
                <div className={`p-4 rounded-lg text-center ${
                  contestState.stage === "judging_3" ? "bg-purple-600" : "bg-gray-800"
                }`}>
                  <p className="font-bold">Stage 3</p>
                  <p className="text-sm text-gray-300">Final Scoring</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
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
  );
}