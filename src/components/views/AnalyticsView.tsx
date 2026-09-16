import React from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import {
  CheckCircle2,
  Clock,
  Zap,
  Target,
  Flame,
  Award
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { tasks, projects, focusSession } = useTaskStore();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Priority counts
  const urgentCount = tasks.filter((t) => t.priority === 'urgent').length;
  const highCount = tasks.filter((t) => t.priority === 'high').length;
  const mediumCount = tasks.filter((t) => t.priority === 'medium').length;
  const lowCount = tasks.filter((t) => t.priority === 'low').length;

  // Estimated focus time
  const totalEstimatedMins = tasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const completedMins = tasks
    .filter((t) => t.status === 'done')
    .reduce((acc, t) => acc + (t.actualMinutes || t.estimatedMinutes || 0), 0);

  // Productivity score calculation
  const productivityScore = Math.min(100, Math.round(completionRate * 0.7 + focusSession.completedPomodoros * 10));

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Productivity Score */}
        <div className="glass-card rounded-2xl p-5 border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Productivity Score</span>
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">{productivityScore}</span>
            <span className="text-xs text-emerald-400 font-mono font-semibold">/ 100</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Based on task completions & focus cycles</p>
        </div>

        {/* Completion Rate */}
        <div className="glass-card rounded-2xl p-5 border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Completion Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">{completionRate}%</span>
            <span className="text-xs text-neutral-400 font-mono">{completedTasks}/{totalTasks}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-neutral-900 mt-2 overflow-hidden border border-white/5">
            <div
              className="h-full bg-emerald-400 rounded-full"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Focus Hours Logged */}
        <div className="glass-card rounded-2xl p-5 border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Focus Hours</span>
            <div className="p-2 rounded-xl bg-neutral-900 text-neutral-300 border border-white/10">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {(completedMins / 60).toFixed(1)}
            </span>
            <span className="text-xs text-neutral-400 font-mono">hrs completed</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 font-mono">{(totalEstimatedMins / 60).toFixed(1)} hrs total estimated</p>
        </div>

        {/* Focus Streak */}
        <div className="glass-card rounded-2xl p-5 border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Pomodoros Done</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {focusSession.completedPomodoros}
            </span>
            <span className="text-xs text-emerald-400 font-mono">sessions</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">~{focusSession.completedPomodoros * 25} minutes in deep flow</p>
        </div>

      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Priority Distribution */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Priority Breakdown</span>
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Urgent', count: urgentCount, color: 'bg-rose-500', text: 'text-rose-400' },
              { label: 'High Priority', count: highCount, color: 'bg-amber-400', text: 'text-amber-400' },
              { label: 'Medium Priority', count: mediumCount, color: 'bg-emerald-400', text: 'text-emerald-400' },
              { label: 'Low Priority', count: lowCount, color: 'bg-neutral-600', text: 'text-neutral-400' },
            ].map((p) => {
              const pct = totalTasks > 0 ? Math.round((p.count / totalTasks) * 100) : 0;
              return (
                <div key={p.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${p.text}`}>{p.label}</span>
                    <span className="text-neutral-400 font-mono">{p.count} tasks ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden border border-white/5">
                    <div className={`h-full ${p.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Workload Distribution */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Award className="w-4 h-4 text-white" />
            <span>Project Workload</span>
          </h3>

          <div className="space-y-3">
            {projects.map((proj) => {
              const projTasks = tasks.filter((t) => t.projectId === proj.id);
              const doneCount = projTasks.filter((t) => t.status === 'done').length;
              const pct = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0;

              return (
                <div key={proj.id} className="p-3 rounded-xl bg-neutral-900 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-white/80" />
                      <span className="font-semibold text-white">{proj.name}</span>
                    </div>
                    <span className="text-neutral-400 font-mono">
                      {doneCount}/{projTasks.length} done ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
