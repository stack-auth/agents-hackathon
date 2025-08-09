"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [isStartingSoon, setIsStartingSoon] = useState(false);
  const router = useRouter();
  const lastWinner = useQuery(api.winners.getLastWinner);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      
      if (currentMinutes >= 0 && currentMinutes < 5) {
        setIsStartingSoon(true);
        setTimeLeft({ minutes: 0, seconds: 0 });
      } else {
        setIsStartingSoon(false);
        const minutesLeft = 59 - currentMinutes;
        const secondsLeft = 59 - currentSeconds;
        setTimeLeft({ minutes: minutesLeft, seconds: secondsLeft });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = () => {
    router.push("/competition");
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center font-mono relative">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-normal text-black tracking-tight">
          VIBERACER
        </h1>
        
        <p className="text-xl text-gray-600">
          Hourly worldwide hackathons
        </p>
        
        <div className="pt-8">
          {isStartingSoon ? (
            <button
              onClick={handleJoin}
              className="px-8 py-4 text-lg bg-black text-white hover:bg-gray-900 transition-colors"
            >
              Starting now — JOIN!
            </button>
          ) : (
            <div className="space-y-4">
              <div className="text-5xl font-normal text-black tabular-nums">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500">
                NEXT RACE
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div 
        className="fixed bottom-8 right-8 transform rotate-[-5deg]"
        style={{
          fontFamily: "'Caveat', cursive",
        }}
      >
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet" />
        <div className="text-gray-700">
          <p className="text-xl mb-1">last winner:</p>
          <p className="text-2xl font-bold text-black">
            {lastWinner ? lastWinner.name : "no races yet"}
          </p>
        </div>
      </div>
    </div>
  );
}