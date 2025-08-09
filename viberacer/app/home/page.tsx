"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function HomePage() {
  const router = useRouter();
  const lastWinner = useQuery(api.winners.getLastWinner);
  const topWinners = useQuery(api.winners.getWeeklyTopWinners);
  const upcomingEvents = useQuery(api.events.getUpcomingEvents);
  const contestState = useQuery(api.race.getCurrentContestState);
  const [timeDisplay, setTimeDisplay] = useState("");
  const [canJoin, setCanJoin] = useState(false);

  useEffect(() => {
    if (!contestState) {
      setTimeDisplay("");
      return;
    }

    const updateTimer = () => {
      if (contestState.timeToNext !== null) {
        const minutes = Math.floor(contestState.timeToNext / 60);
        const seconds = Math.floor(contestState.timeToNext % 60);
        setTimeDisplay(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(() => {
      if (contestState.timeToNext !== null && contestState.timeToNext > 0) {
        contestState.timeToNext--;
        updateTimer();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [contestState]);

  useEffect(() => {
    // Can join if in_progress and within first 15 minutes (from :05 to :20)
    if (contestState?.stage === "in_progress") {
      const now = new Date();
      const minutes = now.getMinutes();
      setCanJoin(minutes >= 5 && minutes < 20);
    } else {
      setCanJoin(false);
    }
  }, [contestState]);

  const handleJoin = () => {
    router.push("/competition");
  };

  const getStageDisplay = () => {
    if (!contestState) return { title: "Loading...", subtitle: "" };
    
    switch (contestState.stage) {
      case "in_progress":
        if (canJoin) {
          return { 
            title: "Join the contest now!", 
            subtitle: ""
          };
        } else {
          // Calculate time to next contest (next hour at :05)
          const now = new Date();
          const minutes = now.getMinutes();
          const seconds = now.getSeconds();
          let secondsToNext;
          if (minutes < 5) {
            secondsToNext = (5 - minutes - 1) * 60 + (60 - seconds);
          } else {
            secondsToNext = (65 - minutes - 1) * 60 + (60 - seconds);
          }
          const hoursToNext = Math.floor(secondsToNext / 3600);
          const minsToNext = Math.floor((secondsToNext % 3600) / 60);
          const secsToNext = secondsToNext % 60;
          const timeToNext = `${hoursToNext}:${String(minsToNext).padStart(2, '0')}:${String(secsToNext).padStart(2, '0')}`;
          return { 
            title: `NEXT CONTEST: ${timeToNext}`, 
            subtitle: ""
          };
        }
      case "judging_1":
        return { 
          title: "JUDGING", 
          subtitle: "Stage 1 - Initial review"
        };
      case "judging_2":
        return { 
          title: "JUDGING", 
          subtitle: "Stage 2 - Deep evaluation"
        };
      case "judging_3":
        return { 
          title: "JUDGING", 
          subtitle: "Stage 3 - Final scoring"
        };
      case "break":
        return { 
          title: `NEXT CONTEST: ${timeDisplay || "0:00"}`, 
          subtitle: ""
        };
      default:
        return { title: "Unknown", subtitle: "" };
    }
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
      
      {/* Last Winner - Bottom Right */}
      <div 
        className="fixed bottom-8 right-8 transform rotate-[-5deg]"
        style={{
          fontFamily: "'Caveat', cursive",
        }}
      >
        <div className="text-gray-700">
          <p className="text-xl mb-2">last winner:</p>
          {lastWinner ? (
            <div className="flex gap-4 items-baseline">
              <p className="text-2xl font-bold text-black">
                {lastWinner.name}
              </p>
              <p className="text-lg text-gray-600">
                {lastWinner.contestHour}
              </p>
            </div>
          ) : (
            <p className="text-2xl font-bold text-black">
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