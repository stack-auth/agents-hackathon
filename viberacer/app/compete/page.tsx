"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { createRepo } from "@/lib/create-repo";
import { useEffect, useRef } from "react";

export default function CompetePage() {
  const router = useRouter();
  const contestState = useQuery(api.race.getCurrentContestState);

  const createRepoAndRedirect = async () => {
    try {
      const repoId = await createRepo();
      router.push(`/hack/${repoId}`);
    } catch (error) {
      console.error("Failed to create repo, redirecting to /hack:", error);
      // Fallback to /hack without repoId if creation fails
      router.push("/hack");
    }
  }

  const hasRedirected = useRef(false);
  const loadTime = useRef(Date.now());
  
  // Redirect based on current stage
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return;
    
    if (!contestState) return;
    
    // Mark as redirected before pushing to prevent race conditions
    hasRedirected.current = true;
    
    switch (contestState.stage) {
      case "in_progress":
        createRepoAndRedirect();
        break;
      case "judging_1":
      case "judging_2":
      case "judging_3":
        router.push("/judge");
        break;
      case "break":
        router.push("/break");
        break;
      default:
        // If we have an unknown stage, don't redirect
        hasRedirected.current = false;
        console.warn("Unknown contest stage:", contestState.stage);
        break;
    }
  }, [contestState, router]);
  
  // Fallback: reload the page after 4 seconds if still stuck
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Only reload if we haven't redirected and have been on the page for 4+ seconds
      if (!hasRedirected.current && Date.now() - loadTime.current >= 4000) {
        console.log("Compete page stuck, reloading...");
        window.location.reload();
      }
    }, 4000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Show loading/redirecting message with countdown
  const secondsElapsed = Math.floor((Date.now() - loadTime.current) / 1000);
  const willReloadIn = Math.max(0, 4 - secondsElapsed);
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
      <div className="text-center space-y-2">
        <p className="text-xl">{contestState ? "Redirecting..." : "Loading..."}</p>
        {!hasRedirected.current && secondsElapsed >= 2 && (
          <p className="text-sm text-gray-400">
            Page will reload in {willReloadIn} second{willReloadIn !== 1 ? 's' : ''}...
          </p>
        )}
      </div>
    </div>
  );
}
