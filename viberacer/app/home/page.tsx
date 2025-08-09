"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function HomePage() {
  const router = useRouter();
  const recentWinners = useQuery(api.winners.getRecentWinners);
  const topWinners = useQuery(api.winners.getWeeklyTopWinners);
  const upcomingEvents = useQuery(api.events.getUpcomingEvents);
  const contestState = useQuery(api.race.getCurrentContestState);
  const [canJoin, setCanJoin] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    // Update every second to refresh countdown
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Can join based on config settings
    const now = new Date();
    const minutes = now.getMinutes();
    
    if (contestState?.stage === "in_progress") {
      // Can join in first 15 minutes of contest (configurable)
      // Config: from :05 to :20 by default
      setCanJoin(minutes >= 5 && minutes < 20);
    } else if (["judging_1", "judging_2", "judging_3", "break"].includes(contestState?.stage || "")) {
      // Can join during judging or break stages (configurable)
      setCanJoin(true);
    } else {
      setCanJoin(false);
    }
  }, [contestState]);

  const handleJoin = () => {
    router.push("/competition");
  };

  const getStageDisplay = () => {
    if (!contestState) return { title: "Loading...", subtitle: "" };
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    
    // Calculate time to next full hour (e.g. 1:00pm, not 1:05pm)
    const secondsToNextHour = (60 - currentMinutes - 1) * 60 + (60 - currentSeconds);
    const hoursToNext = Math.floor(secondsToNextHour / 3600);
    const minsToNext = Math.floor((secondsToNextHour % 3600) / 60);
    const secsToNext = secondsToNextHour % 60;
    const countdownTime = `${String(hoursToNext).padStart(2, '0')}:${String(minsToNext).padStart(2, '0')}:${String(secsToNext).padStart(2, '0')}`;
    
    // Get the next hour time display
    const nextHour = (currentHour + 1) % 24;
    const period = nextHour >= 12 ? 'pm' : 'am';
    const displayHour = nextHour === 0 ? 12 : nextHour > 12 ? nextHour - 12 : nextHour;
    const nextContestTime = `${displayHour}:00${period}`;
    
    // Calculate how long ago contest started (for in_progress stage)
    let minutesAgo = 0;
    if (contestState?.stage === "in_progress" && currentMinutes >= 5) {
      minutesAgo = currentMinutes - 5;
    }
    
    const nextContestTitle = canJoin && contestState.stage === "in_progress" 
      ? `Contest started ${minutesAgo}min ago` 
      : `NEXT CONTEST: ${countdownTime}`;
    
    const subtitle = canJoin && contestState.stage === "in_progress"
      ? `Next contest: ${countdownTime}`
      : "";
    
    return {
      title: nextContestTitle,
      subtitle: subtitle,
    };
  };

  const stageInfo = getStageDisplay();

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center font-mono relative">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-normal text-black tracking-tight">
          VIBERACER
        </h1>
        
        <p className="text-xl text-gray-600">
          Hourly worldwide hackathons
        </p>
        
        <div className="pt-8 space-y-4">
          <div className="text-3xl font-bold text-black">
            {stageInfo.title}
          </div>
          {stageInfo.subtitle && (
            <div className="text-lg text-gray-600">
              {stageInfo.subtitle}
            </div>
          )}
          
          {canJoin && (
            <button
              onClick={handleJoin}
              className="mt-4 px-8 py-4 text-lg bg-black text-white hover:bg-gray-900 transition-colors"
            >
              JOIN CONTEST
            </button>
          )}
          
        </div>
      </div>
      
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet" />
      
      {/* Recent Winners - Bottom Right */}
      <div 
        className="fixed bottom-8 right-8 transform rotate-[-5deg]"
        style={{
          fontFamily: "'Caveat', cursive",
        }}
      >
        <div className="text-gray-700">
          <p className="text-xl mb-2">recent winners:</p>
          {recentWinners && recentWinners.length > 0 ? (
            <div className="space-y-1">
              {recentWinners.map((winner, idx) => (
                <div key={idx} className="flex gap-4 items-baseline">
                  <p className="text-xl font-bold text-black">
                    {winner.name}
                  </p>
                  <p className="text-lg text-gray-600">
                    {winner.contestHour}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xl text-black">
              no contests yet
            </p>
          )}
        </div>
      </div>
      
      {/* Top Winners Weekly - Bottom Left */}
      <div 
        className="fixed bottom-8 left-8 transform rotate-[3deg]"
        style={{
          fontFamily: "'Caveat', cursive",
        }}
      >
        <div className="text-gray-700">
          <p className="text-xl mb-2">top winners (weekly):</p>
          {topWinners && topWinners.length > 0 ? (
            <div className="space-y-1">
              {topWinners.map((winner, idx) => {
                const emoji = idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉';
                return (
                  <div key={idx} className="flex gap-4 items-baseline">
                    <p className="text-xl font-bold text-black">
                      {emoji} {winner.name}
                    </p>
                    <p className="text-lg text-gray-600">
                      {winner.wins} wins
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xl text-gray-500">loading...</p>
          )}
        </div>
      </div>
      
      {/* Upcoming Events - Top Right */}
      <div 
        className="fixed top-8 right-8 transform rotate-[-2deg]"
        style={{
          fontFamily: "'Caveat', cursive",
        }}
      >
        <div className="text-gray-700">
          <p className="text-xl mb-2">upcoming events:</p>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-1">
              {upcomingEvents.map((event, idx) => (
                <div key={idx} className="flex gap-4 items-baseline">
                  <p className="text-xl font-bold text-black">
                    {event.type}
                  </p>
                  <p className="text-lg text-gray-600">
                    {event.time}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xl text-gray-500">loading...</p>
          )}
        </div>
      </div>
    </div>
  );
}
