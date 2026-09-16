import React, { useEffect, useRef } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  Flame,
  Check
} from 'lucide-react';

export const FocusView: React.FC = () => {
  const {
    focusSession,
    updateFocusSession,
    tickFocusTimer,
    tasks,
    toggleTaskCompletion,
  } = useTaskStore();

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Timer Tick Interval
  useEffect(() => {
    let interval: any = null;
    if (focusSession.isActive) {
      interval = setInterval(() => {
        tickFocusTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusSession.isActive, tickFocusTimer]);

  // Ambient sound synthesizer
  const toggleAmbientSound = (soundType: 'none' | 'whitenoise' | 'rain' | 'binaural') => {
    if (soundType === 'none') {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (e) {}
        oscillatorRef.current = null;
      }
      updateFocusSession({ soundEnabled: false, soundType: 'none' });
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      if (soundType === 'binaural') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(210, ctx.currentTime);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;

      updateFocusSession({ soundEnabled: true, soundType });
    } catch (e) {
      console.warn('Audio synthesis not permitted or error:', e);
    }
  };

  const minutes = Math.floor(focusSession.timeLeftSeconds / 60);
  const seconds = focusSession.timeLeftSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((focusSession.totalDurationSeconds - focusSession.timeLeftSeconds) / focusSession.totalDurationSeconds) * 100;

  const activeTask = tasks.find((t) => t.id === focusSession.taskId);
  const pendingTasks = tasks.filter((t) => t.status !== 'done');

  const handleSetMode = (mode: 'pomodoro' | 'short_break' | 'long_break') => {
    let dur = 25 * 60;
    if (mode === 'short_break') dur = 5 * 60;
    if (mode === 'long_break') dur = 15 * 60;

    updateFocusSession({
      mode,
      isActive: false,
      timeLeftSeconds: dur,
      totalDurationSeconds: dur,
    });
  };

  const handleCompleteActiveTask = () => {
    if (!activeTask) return;
    toggleTaskCompletion(activeTask.id);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#10b981', '#34d399'],
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4 pb-12">
      
      {/* Focus Mode Card */}
      <div className="glass-panel rounded-3xl p-8 border-white/10 text-center relative overflow-hidden shadow-2xl">
        
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mode Selector Tabs */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-neutral-900 border border-white/10 mb-8">
          <button
            onClick={() => handleSetMode('pomodoro')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              focusSession.mode === 'pomodoro'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Pomodoro (25m)
          </button>
          <button
            onClick={() => handleSetMode('short_break')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              focusSession.mode === 'short_break'
                ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Short Break (5m)
          </button>
          <button
            onClick={() => handleSetMode('long_break')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              focusSession.mode === 'long_break'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Giant Timer Display */}
        <div className="relative py-4">
          <h1 className="text-7xl sm:text-8xl font-black tracking-tight font-mono text-white drop-shadow-lg select-none">
            {formattedTime}
          </h1>

          {/* Circular/Line Progress */}
          <div className="w-64 h-1.5 rounded-full bg-neutral-900 mx-auto mt-6 overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-1000 ${
                focusSession.mode === 'pomodoro' ? 'bg-emerald-400' : 'bg-white'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 mt-8">
          <button
            onClick={() => updateFocusSession({ isActive: !focusSession.isActive })}
            className="flex items-center space-x-2 px-8 py-3.5 rounded-2xl bg-white text-black hover:bg-neutral-200 text-base font-extrabold shadow-xl shadow-white/10 transition-all hover:scale-105 active:scale-95"
          >
            {focusSession.isActive ? (
              <>
                <Pause className="w-5 h-5 text-black" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current text-black" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleSetMode(focusSession.mode)}
            className="p-3.5 rounded-2xl bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-white/10 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Ambient Sound Toggles */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center space-x-2 text-xs">
          <span className="text-neutral-400">Ambient audio:</span>
          {(['none', 'binaural', 'rain'] as const).map((sType) => {
            const isActive = focusSession.soundType === sType;
            return (
              <button
                key={sType}
                onClick={() => toggleAmbientSound(sType)}
                className={`px-3 py-1 rounded-lg font-medium border transition-colors ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-neutral-900 text-neutral-400 border-white/5 hover:text-white'
                }`}
              >
                {sType === 'none' ? 'Off' : sType.charAt(0).toUpperCase() + sType.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-neutral-400 font-mono">
          <div className="flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>{focusSession.completedPomodoros} Pomodoro{focusSession.completedPomodoros !== 1 ? 's' : ''} today</span>
          </div>
        </div>

      </div>

      {/* Target Task Section */}
      <div className="glass-card rounded-2xl p-6 border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase font-bold tracking-wider text-neutral-400">
            Active Task Focus
          </h3>
          <span className="text-[11px] text-emerald-400 font-mono font-semibold">
            {activeTask ? 'Focused Task' : 'No task selected'}
          </span>
        </div>

        {activeTask ? (
          <div className="p-4 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{activeTask.title}</h4>
              {activeTask.description && (
                <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{activeTask.description}</p>
              )}
            </div>
            <button
              onClick={handleCompleteActiveTask}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1 shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Mark Done</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-neutral-400">Select a task from your queue to anchor your focus session:</p>
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {pendingTasks.slice(0, 5).map((task) => (
                <button
                  key={task.id}
                  onClick={() => updateFocusSession({ taskId: task.id })}
                  className="w-full text-left p-2.5 rounded-xl bg-neutral-900/60 hover:bg-white/5 border border-white/5 text-xs text-neutral-200 flex items-center justify-between"
                >
                  <span className="truncate">{task.title}</span>
                  <span className="text-[10px] text-neutral-400 font-mono uppercase font-semibold px-1.5 py-0.5 rounded bg-neutral-800 border border-white/5">
                    {task.priority}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
