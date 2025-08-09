"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export default function CompetePage() {
  const router = useRouter();
  const contestState = useQuery(api.race.getCurrentContestState);
  
  // Redirect based on current stage
  useEffect(() => {
    if (!contestState) return;
    
    switch (contestState.stage) {
      case "in_progress":
        router.push("/hack");
        break;
      case "judging_1":
      case "judging_2":
      case "judging_3":
        router.push("/judge");
        break;
      case "break":
        router.push("/break");
        break;
    }
  }, [contestState, router]);

  // Show loading while redirecting
  if (!contestState) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }
  
  // Show redirecting message
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
      <p className="text-xl">Redirecting...</p>
    </div>
  );
}