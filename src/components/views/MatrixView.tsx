import React from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { MatrixQuadrant } from '../../types';
import {
  Flame,
  Calendar,
  Users,
  Trash2,
  Sparkles,
  Circle
} from 'lucide-react';
import { AIService } from '../../services/aiService';

export const MatrixView: React.FC = () => {
  const {
    tasks,
    updateTask,
    openTaskModal,
    toggleTaskCompletion,
    setAgentDrawerOpen,
    addAgentMessage,
    setAgentThinking,
  } = useTaskStore();

  const quadrants: {
    id: MatrixQuadrant;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    borderColor: string;
    bgGlow: string;
  }[] = [
    {
      id: 'do_first',
      title: 'Quadrant I: Do First',
      subtitle: 'Urgent & Important (Crises & Deadlines)',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      color: 'text-rose-400',
      borderColor: 'border-rose-500/25',
      bgGlow: 'bg-rose-950/5',
    },
    {
      id: 'schedule',
      title: 'Quadrant II: Schedule',
      subtitle: 'Not Urgent but Important (Growth, Planning & Health)',
      icon: <Calendar className="w-4 h-4 text-emerald-400" />,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/25',
      bgGlow: 'bg-emerald-950/5',
    },
    {
      id: 'delegate',
      title: 'Quadrant III: Delegate',
      subtitle: 'Urgent but Not Important (Interruptions & Chores)',
      icon: <Users className="w-4 h-4 text-amber-400" />,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/25',
      bgGlow: 'bg-amber-950/5',
    },
    {
      id: 'eliminate',
      title: 'Quadrant IV: Eliminate',
      subtitle: 'Not Urgent & Not Important (Time Wasters)',
      icon: <Trash2 className="w-4 h-4 text-neutral-400" />,
      color: 'text-neutral-400',
      borderColor: 'border-white/10',
      bgGlow: 'bg-black/20',
    },
  ];

  const handleAutoRebalance = async () => {
    setAgentDrawerOpen(true);
    addAgentMessage({
      sender: 'user',
      content: 'Reorganize my tasks using the Eisenhower matrix',
    });
    setAgentThinking(true);
    try {
      const res = await AIService.processUserMessage('Reorganize tasks with Eisenhower matrix');
      addAgentMessage({
        sender: 'agent',
        content: res.message,
        toolCalls: res.toolCalls,
      });
    } catch (e: any) {
      addAgentMessage({
        sender: 'system',
        content: `Error: ${e.message}`,
      });
    } finally {
      setAgentThinking(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      
      {/* Top Banner with AI Rebalance button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-panel border-white/10">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <span>Eisenhower Decision Matrix</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Categorize tasks by urgency and importance to maximize high-impact execution.
          </p>
        </div>
        <button
          onClick={handleAutoRebalance}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-neutral-200 shadow-md transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>AI Auto-Sort Matrix</span>
        </button>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((q) => {
          const quadTasks = tasks.filter((t) => t.quadrant === q.id && t.status !== 'done');

          return (
            <div
              key={q.id}
              className={`glass-panel rounded-2xl p-4.5 border ${q.borderColor} ${q.bgGlow} flex flex-col min-h-[300px]`}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-neutral-900 border border-white/10">
                    {q.icon}
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${q.color}`}>{q.title}</h3>
                    <p className="text-[10px] text-neutral-400">{q.subtitle}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-white/10">
                  {quadTasks.length}
                </span>
              </div>

              {/* Task Items in Quadrant */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {quadTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-6 text-center text-xs text-neutral-600">
                    No active tasks in this quadrant
                  </div>
                ) : (
                  quadTasks.map((task) => (
                    <div
                      key={task.id}
                      className="glass-card rounded-xl p-3 flex items-center justify-between gap-2 group hover:border-emerald-500/40"
                    >
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                        <button
                          onClick={() => toggleTaskCompletion(task.id)}
                          className="text-neutral-500 hover:text-emerald-400 transition-colors"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <span
                          onClick={() => openTaskModal(task.id)}
                          className="text-xs font-medium text-neutral-200 hover:text-emerald-400 cursor-pointer truncate"
                        >
                          {task.title}
                        </span>
                      </div>

                      {/* Move to another quadrant dropdown */}
                      <select
                        value={task.quadrant}
                        onChange={(e) => updateTask(task.id, { quadrant: e.target.value as MatrixQuadrant })}
                        className="bg-neutral-900 text-[10px] font-mono text-neutral-400 px-1.5 py-0.5 rounded border border-white/10 focus:outline-none"
                      >
                        <option value="do_first">I. Do First</option>
                        <option value="schedule">II. Schedule</option>
                        <option value="delegate">III. Delegate</option>
                        <option value="eliminate">IV. Eliminate</option>
                      </select>
                    </div>
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
