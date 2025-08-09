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
  const raceState = useQuery(api.race.getCurrentRaceState);
  const [timeDisplay, setTimeDisplay] = useState("");
  const [canJoin, setCanJoin] = useState(false);

  useEffect(() => {
    if (!raceState || raceState.manualOverride) {
      setTimeDisplay("");
      return;
    }

    const updateTimer = () => {
      if (raceState.timeToNext !== null) {
        const minutes = Math.floor(raceState.timeToNext / 60);
        const seconds = Math.floor(raceState.timeToNext % 60);
        setTimeDisplay(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(() => {
      if (raceState.timeToNext !== null && raceState.timeToNext > 0) {
        raceState.timeToNext--;
        updateTimer();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [raceState]);

  useEffect(() => {
    // Can join if in_progress and within first 15 minutes (from :05 to :20)
    if (raceState?.stage === "in_progress") {
      const now = new Date();
      const minutes = now.getMinutes();
      setCanJoin(minutes >= 5 && minutes < 20);
    } else {
      setCanJoin(false);
    }
  }, [raceState]);

  const handleJoin = () => {
    router.push("/competition");
  };

  const getStageDisplay = () => {
    if (!raceState) return { title: "Loading...", subtitle: "" };
    
    switch (raceState.stage) {
      case "in_progress":
        if (canJoin) {
          return { 
            title: "Join the race now!", 
            subtitle: ""
          };
        } else {
          // Calculate time to next race (next hour at :05)
          const now = new Date();
          const minutes = now.getMinutes();
          let minutesToNext;
          if (minutes < 5) {
            minutesToNext = 5 - minutes;
          } else {
            minutesToNext = 65 - minutes;
          }
          const hoursToNext = Math.floor(minutesToNext / 60);
          const minsToNext = minutesToNext % 60;
          const timeToNext = hoursToNext > 0 
            ? `${hoursToNext}:${String(minsToNext).padStart(2, '0')}` 
            : `0:${String(minsToNext).padStart(2, '0')}`;
          return { 
            title: `NEXT RACE: ${timeToNext}`, 
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
          title: `NEXT RACE: ${timeDisplay || "0:00"}`, 
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
              JOIN RACE
            </button>
          )}
          
          {raceState?.manualOverride && (
            <div className="mt-2 text-sm text-orange-600">
              ⚠️ Manual override active
            </div>
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
                {lastWinner.raceHour}
              </p>
            </div>
          ) : (
            <p className="text-2xl font-bold text-black">
              no races yet
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