"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import GlitchText from "../../react-bits/text-animations/GlitchText/GlitchText";
import { downloadICS } from "../utils/icsGenerator";

export default function HomePage() {
  const router = useRouter();
  const recentWinners = useQuery(api.winners.getRecentWinners);
  const topWinners = useQuery(api.winners.getWeeklyTopWinners);
  const upcomingEvents = useQuery(api.events.getUpcomingEvents);
  const contestState = useQuery(api.race.getCurrentContestState);
  const contestConfig = useQuery(api.config.getContestConfig);
  const currentUser = useQuery(api.auth.currentUser);
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
    if (!contestConfig || !contestState) {
      setCanJoin(false);
      return;
    }
    
    const now = new Date();
    const minutes = now.getMinutes();
    
    if (contestState.stage === "in_progress") {
      // Can join in first X minutes of contest (from config)
      const joinEndMinute = (contestConfig.stages.in_progress.startMinute + contestConfig.joinWindow.durationMinutes) % 60;
      
      if (joinEndMinute < contestConfig.stages.in_progress.startMinute) {
        // Join window wraps around hour
        setCanJoin(minutes >= contestConfig.stages.in_progress.startMinute || minutes < joinEndMinute);
      } else {
        setCanJoin(minutes >= contestConfig.stages.in_progress.startMinute && minutes < joinEndMinute);
      }
    } else if (contestConfig.joinWindow.alwaysJoinableStages.includes(contestState.stage)) {
      // Can join during specified stages (from config)
      setCanJoin(true);
    } else {
      setCanJoin(false);
    }
  }, [contestState, contestConfig]);

  const handleJoin = () => {
    router.push("/compete");
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
    
    // Get the next hour time display (removed - not used)
    
    // Calculate how long ago contest started (for in_progress stage)
    let minutesAgo = 0;
    if (contestState?.stage === "in_progress" && contestConfig) {
      const startMinute = contestConfig.stages.in_progress.startMinute;
      if (currentMinutes >= startMinute) {
        minutesAgo = currentMinutes - startMinute;
      }
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
    <div className="w-full font-mono">
      {/* Hero Section - Fullscreen */}
      <section className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
        
        {/* Main content */}
        <div className="text-center space-y-8 relative z-10">
          <GlitchText
            speed={10}
            enableShadows={true}
            enableOnHover={true}
          >
            VIBERACER
          </GlitchText>
          
          <p className="text-xl text-gray-300">
            Hourly worldwide hackathons
          </p>
          
          <div className="pt-8 space-y-4">
            <div className="text-4xl font-bold text-white">
              {stageInfo.title}
            </div>
            {stageInfo.subtitle && (
              <div className="text-xl text-gray-400">
                {stageInfo.subtitle}
              </div>
            )}
            
            {canJoin ? (
              <button
                onClick={handleJoin}
                className="mt-4 px-10 py-5 text-xl bg-gradient-to-r bg-white text-black hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 font-bold rounded-lg shadow-2xl"
              >
                JOIN CONTEST
              </button>
            ) : contestConfig && !canJoin ? (
              <p className="text-sm text-gray-500 mt-4">
                You'll be able to join from this page at :{String(contestConfig.stages.in_progress.startMinute).padStart(2, '0')}
              </p>
            ) : null}
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* What is Viberacer Section */}
      <section className="min-h-screen bg-gradient-to-b from-black to-purple-900 text-white flex items-center justify-center py-20">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <h2 className="text-5xl font-bold mb-8">⚡ Code. Compete. Conquer.</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-3">Every Hour</h3>
              <p className="text-gray-300">A new competition starts at the top of every hour. No waiting, no scheduling conflicts.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold mb-3">Global Arena</h3>
              <p className="text-gray-300">Compete with developers from every timezone. Your code vs the world.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-2xl font-bold mb-3">
                {contestConfig ? 
                  `${(contestConfig.stages.judging_1.startMinute || 60) - contestConfig.stages.in_progress.startMinute} Minutes` 
                  : "36 Minutes"}
              </h3>
              <p className="text-gray-300">Pure coding adrenaline. No time for overthinking. Just ship it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="min-h-screen bg-gradient-to-b from-purple-900 to-pink-900 text-white flex items-center justify-center py-20">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-5xl font-bold text-center mb-16">How It Works</h2>
          <div className="space-y-12">
            <div className="flex items-center space-x-6">
              <div className="text-3xl font-bold bg-white/20 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  :{String(contestConfig?.stages.in_progress.startMinute || 5).padStart(2, '0')} - Contest Starts
                </h3>
                <p className="text-gray-300">Challenge drops. Timer starts. Code like your life depends on it.</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-3xl font-bold bg-white/20 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  :{String(contestConfig?.stages.judging_1.startMinute || 0).padStart(2, '0')} - Pencils Down
                </h3>
                <p className="text-gray-300">Code submission closes. Your masterpiece is locked in.</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-3xl font-bold bg-white/20 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  :{String(contestConfig?.stages.judging_1.startMinute || 0).padStart(2, '0')}-:{String(contestConfig?.stages.break.startMinute || 3).padStart(2, '0')} - Judging
                </h3>
                <p className="text-gray-300">AI judges evaluate speed, creativity, and code quality.</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-3xl font-bold bg-white/20 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">4</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  :{String(contestConfig?.stages.break.startMinute || 3).padStart(2, '0')} - Winner Crowned
                </h3>
                <p className="text-gray-300">Glory, fame, and eternal bragging rights.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="min-h-[50vh] bg-gradient-to-b from-pink-900 to-black text-white flex items-center justify-center py-20">
        <div className="text-center space-y-8">
          <h2 className="text-6xl font-bold">Ready to Race?</h2>
          <p className="text-2xl text-gray-300">The next contest starts soon.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-12 py-6 text-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 font-bold rounded-lg shadow-2xl"
          >
            Back to Top
          </button>
        </div>
      </section>
      
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet" />
      
      {/* Recent Winners - Bottom Right */}
      <div 
        className="fixed bottom-8 right-8 transform rotate-[-5deg]"
        style={{
          fontFamily: "'Caveat', cursive",
        }}
      >
        <div className="text-gray-300">
          <p className="text-xl mb-2">recent winners:</p>
          {recentWinners && recentWinners.length > 0 ? (
            <div className="space-y-1">
              {recentWinners.map((winner, idx) => (
                <div key={idx} className="flex gap-4 items-baseline">
                  <p className="text-xl font-bold text-white">
                    {winner.name}
                  </p>
                  <p className="text-lg text-gray-400">
                    {winner.contestHour}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xl text-white">
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
        <div className="text-gray-300">
          <p className="text-xl mb-2">top winners (weekly):</p>
          {topWinners && topWinners.length > 0 ? (
            <div className="space-y-1">
              {topWinners.map((winner, idx) => {
                const emoji = idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉';
                return (
                  <div key={idx} className="flex gap-4 items-baseline">
                    <p className="text-xl font-bold text-white">
                      {emoji} {winner.name}
                    </p>
                    <p className="text-lg text-gray-400">
                      {winner.wins} wins
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xl text-gray-400">loading...</p>
          )}
        </div>
      </div>
      
      {/* Welcome Message or Sign In - Top Right (above upcoming events) */}
      <div className="fixed top-8 right-8 font-mono">
        {currentUser ? (
          <p className="text-sm text-gray-300">
            Welcome back, {currentUser.name || currentUser.email?.split('@')[0] || 'friend'}!
          </p>
        ) : (
          <button
            onClick={() => router.push('/signin')}
            className="text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            Sign in to compete →
          </button>
        )}
      </div>
      
      {/* Upcoming Events - Top Right (always moved down) */}
      <div 
        className="fixed top-20 right-8 transform rotate-[-2deg]"
        style={{
          fontFamily: "'Caveat', cursive",
        }}
      >
        <div className="text-gray-300">
          <p className="text-xl mb-2">upcoming events:</p>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-1">
              {upcomingEvents.map((event, idx) => (
                <div 
                  key={idx} 
                  className="flex gap-4 items-baseline px-2 py-1 -mx-2 rounded cursor-pointer transition-colors hover:bg-white/10"
                  onClick={() => downloadICS(`Viberacer ${event.type}`, event.time)}
                  title="Click to add to calendar"
                >
                  <p className="text-xl font-bold text-white">
                    {event.type}
                  </p>
                  <p className="text-lg text-gray-400">
                    {event.time}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xl text-gray-400">loading...</p>
          )}
        </div>
      </div>
    </div>
  );
}
