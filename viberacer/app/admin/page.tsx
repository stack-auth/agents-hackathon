"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const raceState = useQuery(api.race.getCurrentRaceState);
  const advanceStage = useMutation(api.race.advanceStage);
  const resetToAutomatic = useMutation(api.race.resetToAutomatic);

  const handleAdvance = async () => {
    await advanceStage();
  };

  const handleReset = async () => {
    await resetToAutomatic();
  };

  const getStageInfo = () => {
    if (!raceState) return "Loading...";
    
    const stageNames = {
      in_progress: "Race In Progress",
      judging_1: "Judging - Stage 1",
      judging_2: "Judging - Stage 2",
      judging_3: "Judging - Stage 3",
      break: "Break",
    };
    
    return stageNames[raceState.stage] || raceState.stage;
  };

  const getNextStage = () => {
    if (!raceState) return "";
    
    const stageOrder = {
      in_progress: "judging_1",
      judging_1: "judging_2",
      judging_2: "judging_3",
      judging_3: "break",
      break: "in_progress",
    };
    
    const nextStage = stageOrder[raceState.stage];
    const stageNames = {
      in_progress: "Race In Progress",
      judging_1: "Judging - Stage 1",
      judging_2: "Judging - Stage 2",
      judging_3: "Judging - Stage 3",
      break: "Break",
    };
    
    return stageNames[nextStage] || nextStage;
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center font-mono">
      <div className="max-w-2xl w-full px-8">
        <h1 className="text-4xl font-bold text-black mb-8">
          ADMIN PANEL
        </h1>
        
        <div className="space-y-6 bg-gray-50 p-8 border border-gray-200">
          <div>
            <p className="text-sm text-gray-600 mb-2">Current Stage</p>
            <p className="text-2xl font-bold text-black">{getStageInfo()}</p>
            {raceState?.manualOverride && (
              <p className="text-sm text-orange-600 mt-1">⚠️ Manual override active</p>
            )}
          </div>
          
          {raceState?.timeToNext !== null && !raceState?.manualOverride && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Auto-advance in</p>
              <p className="text-xl font-mono text-black">
                {Math.floor(raceState.timeToNext / 60)}:{String(Math.floor(raceState.timeToNext % 60)).padStart(2, '0')}
              </p>
            </div>
          )}
          
          <div className="space-y-3 pt-4">
            <button
              onClick={handleAdvance}
              className="w-full px-6 py-3 bg-black text-white hover:bg-gray-900 transition-colors"
            >
              ADVANCE TO: {getNextStage()}
            </button>
            
            {raceState?.manualOverride && (
              <button
                onClick={handleReset}
                className="w-full px-6 py-3 bg-gray-600 text-white hover:bg-gray-700 transition-colors"
              >
                RESET TO AUTOMATIC MODE
              </button>
            )}
          </div>
          
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Schedule (automatic mode)</p>
            <div className="space-y-1 text-sm font-mono">
              <p>:05-:59 — Race in progress</p>
              <p>:00-:00 — Judging stage 1</p>
              <p>:01-:01 — Judging stage 2</p>
              <p>:02-:02 — Judging stage 3</p>
              <p>:03-:04 — Break</p>
            </div>
          </div>
          
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