import React from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { FilterTimeframe, Priority, ViewMode } from '../../types';
import {
  Inbox,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  LayoutList,
  Columns3,
  Grid2x2,
  Timer,
  BarChart3
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    tasks,
    projects,
    filters,
    setFilters,
    resetFilters,
    activeView,
    setActiveView,
    rescheduleOverdueTasks
  } = useTaskStore();

  const todayStr = new Date().toISOString().split('T')[0];

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const todayCount = tasks.filter((t) => t.status !== 'done' && t.dueDate === todayStr).length;
  const overdueCount = tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr).length;
  const upcomingCount = tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate > todayStr).length;

  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const timeframeNav: { id: FilterTimeframe; label: string; icon: React.ReactNode; count: number; badgeColor?: string }[] = [
    { id: 'all', label: 'All Tasks', icon: <Inbox className="w-4 h-4" />, count: totalCount },
    { id: 'today', label: 'Due Today', icon: <Calendar className="w-4 h-4 text-emerald-400" />, count: todayCount, badgeColor: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' },
    { id: 'upcoming', label: 'Upcoming', icon: <Clock className="w-4 h-4 text-neutral-300" />, count: upcomingCount },
    { id: 'overdue', label: 'Overdue', icon: <AlertCircle className="w-4 h-4 text-rose-400" />, count: overdueCount, badgeColor: 'text-rose-400 bg-rose-500/10 border border-rose-500/20' },
    { id: 'completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4 text-neutral-400" />, count: completedCount },
  ];

  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'list', label: 'List View', icon: <LayoutList className="w-4 h-4" /> },
    { id: 'kanban', label: 'Kanban Board', icon: <Columns3 className="w-4 h-4" /> },
    { id: 'matrix', label: 'Eisenhower Matrix', icon: <Grid2x2 className="w-4 h-4" /> },
    { id: 'focus', label: 'Focus & Pomodoro', icon: <Timer className="w-4 h-4" /> },
    { id: 'analytics', label: 'Productivity Stats', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const priorities: { id: Priority; label: string; dot: string }[] = [
    { id: 'urgent', label: 'Urgent', dot: 'bg-rose-500' },
    { id: 'high', label: 'High Priority', dot: 'bg-amber-400' },
    { id: 'medium', label: 'Medium', dot: 'bg-emerald-400' },
    { id: 'low', label: 'Low', dot: 'bg-neutral-500' },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16 border-r border-white/10 bg-black/60 p-4 space-y-6 overflow-y-auto">
      
      {/* Mobile/Compact View Switcher */}
      <div className="lg:hidden space-y-1">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 px-3">Views</p>
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === v.id
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {v.icon}
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      {/* Timeframe Navigation */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 mb-1.5">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">Timelines</p>
          {(filters.timeframe !== 'all' || filters.priority !== 'all' || filters.projectId !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
        {timeframeNav.map((item) => {
          const isSelected = filters.timeframe === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setFilters({ timeframe: item.id })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-neutral-900 text-white shadow-sm border border-white/15'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  item.badgeColor || 'text-neutral-400 bg-neutral-900 border border-white/5'
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Priority Filters */}
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 px-3 mb-1.5">
          Priority
        </p>
        {priorities.map((p) => {
          const isSelected = filters.priority === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setFilters({ priority: isSelected ? 'all' : p.id })}
              className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-neutral-900 text-white border border-white/15'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${p.dot}`} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Projects */}
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 px-3 mb-1.5">
          Projects
        </p>
        {projects.map((proj) => {
          const isSelected = filters.projectId === proj.id;
          const projCount = tasks.filter((t) => t.projectId === proj.id && t.status !== 'done').length;
          return (
            <button
              key={proj.id}
              onClick={() => setFilters({ projectId: isSelected ? 'all' : proj.id })}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-neutral-900 text-white border border-white/15'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-white/60" />
                <span className="truncate">{proj.name}</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-semibold">{projCount}</span>
            </button>
          );
        })}
      </div>

      {/* Overdue Warning & Quick Fix */}
      {overdueCount > 0 && (
        <div className="p-3 rounded-xl bg-neutral-900/90 border border-rose-500/30 text-xs space-y-2">
          <div className="flex items-center space-x-1.5 text-rose-400 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{overdueCount} Overdue Task{overdueCount > 1 ? 's' : ''}</span>
          </div>
          <button
            onClick={() => rescheduleOverdueTasks()}
            className="w-full py-1.5 px-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 font-bold transition-colors flex items-center justify-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Reschedule to Today</span>
          </button>
        </div>
      )}

      {/* Daily Progress Widget */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-2">
          <span>Overall Progress</span>
          <span className="text-emerald-400 font-mono">{completionPercent}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden border border-white/5">
          <div
            className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-neutral-400 mt-2 font-mono">
          {completedCount} of {totalCount} tasks completed
        </p>
      </div>

    </aside>
  );
};
