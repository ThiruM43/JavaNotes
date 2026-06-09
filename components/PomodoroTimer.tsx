'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getTodaySession, savePomodoroSession } from '@/lib/storage';

type Phase = 'focus' | 'break' | 'longBreak';

const DURATIONS: Record<Phase, number> = {
  focus: 25 * 60,
  break: 5 * 60,
  longBreak: 15 * 60,
};

const LABELS: Record<Phase, string> = {
  focus: 'Focus',
  break: 'Short Break',
  longBreak: 'Long Break',
};

export default function PomodoroTimer() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('focus');
  const [remaining, setRemaining] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [todayPomodoros, setTodayPomodoros] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setTodayPomodoros(getTodaySession().completedPomodoros);
  }, []);

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  }, []);

  const nextPhase = useCallback(() => {
    playBeep();
    if (phase === 'focus') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      // Update today's stats
      const session = getTodaySession();
      session.completedPomodoros++;
      session.totalMinutes += 25;
      savePomodoroSession(session);
      setTodayPomodoros(session.completedPomodoros);
      // Long break every 4 pomodoros
      const nextP: Phase = newCount % 4 === 0 ? 'longBreak' : 'break';
      setPhase(nextP);
      setRemaining(DURATIONS[nextP]);
    } else {
      setPhase('focus');
      setRemaining(DURATIONS.focus);
    }
    setRunning(false);
  }, [phase, sessionCount, playBeep]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(intervalRef.current!);
            nextPhase();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, nextPhase]);

  const reset = () => {
    setRunning(false);
    setRemaining(DURATIONS[phase]);
  };

  const switchPhase = (p: Phase) => {
    setRunning(false);
    setPhase(p);
    setRemaining(DURATIONS[p]);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const pct = ((DURATIONS[phase] - remaining) / DURATIONS[phase]) * 100;

  const phaseColors: Record<Phase, string> = {
    focus: 'text-orange-400',
    break: 'text-green-400',
    longBreak: 'text-blue-400',
  };
  const ringColors: Record<Phase, string> = {
    focus: 'stroke-orange-500',
    break: 'stroke-green-500',
    longBreak: 'stroke-blue-500',
  };

  const r = 44;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference - (pct / 100) * circumference;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 bg-gray-800 border border-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors group"
        title="Pomodoro Timer"
      >
        <span className="text-2xl">⏱️</span>
        {running && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-72 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Pomodoro Timer</h3>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300">✕</button>
          </div>

          {/* Phase selector */}
          <div className="flex gap-1 mb-5">
            {(['focus', 'break', 'longBreak'] as Phase[]).map((p) => (
              <button
                key={p}
                onClick={() => switchPhase(p)}
                className={`flex-1 text-xs py-1 rounded-lg transition-colors ${
                  phase === p ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {LABELS[p]}
              </button>
            ))}
          </div>

          {/* Circular timer */}
          <div className="flex justify-center mb-5">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="#374151" strokeWidth="5" />
                <circle
                  cx="50" cy="50" r={r} fill="none"
                  className={ringColors[phase]}
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDash}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold font-mono ${phaseColors[phase]}`}>{mm}:{ss}</span>
                <span className="text-xs text-gray-500">{LABELS[phase]}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 justify-center mb-4">
            <button
              onClick={() => setRunning((r) => !r)}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {running ? '⏸ Pause' : '▶ Start'}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
            >
              ↺
            </button>
          </div>

          {/* Stats */}
          <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-gray-800">
            <span>Session: {sessionCount} 🍅</span>
            <span>Today: {todayPomodoros} 🍅</span>
          </div>
        </div>
      )}
    </>
  );
}
