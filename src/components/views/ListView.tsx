import React, { useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { Task, Priority } from '../../types';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Calendar,
  CheckCheck,
  Timer
} from 'lucide-react';
import { AIService } from '../../services/aiService';

export const ListView: React.FC = () => {
  const {
    tasks,
    projects,
    filters,
    toggleTaskCompletion,
    deleteTask,
    openTaskModal,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    batchUpdateStatus,
    batchDeleteTasks,
    setActiveView,
    updateFocusSession,
    addToast,
    addAgentMessage,
    setAgentThinking,
    setAgentDrawerOpen,
  } = useTaskStore();

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering Logic
  const filteredTasks = tasks.filter((task) => {
    // Search query filter
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTag = task.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }

    // Priority filter
    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }

    // Project filter
    if (filters.projectId !== 'all' && task.projectId !== filters.projectId) {
      return false;
    }

    // Timeframe filter
    if (filters.timeframe === 'today') {
      return task.dueDate === todayStr && task.status !== 'done';
    }
    if (filters.timeframe === 'upcoming') {
      return task.dueDate && task.dueDate > todayStr && task.status !== 'done';
    }
    if (filters.timeframe === 'overdue') {
      return task.dueDate && task.dueDate < todayStr && task.status !== 'done';
    }
    if (filters.timeframe === 'completed') {
      return task.status === 'done';
    }

    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTaskCheck = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const willBeDone = task.status !== 'done';
    toggleTaskCompletion(task.id);

    if (willBeDone) {
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#ffffff', '#10b981', '#34d399', '#a3a3a3'],
      });
    }
  };

  const handleAddInlineSubtask = (taskId: string) => {
    const text = newSubtaskInputs[taskId]?.trim();
    if (!text) return;
    addSubtask(taskId, text, 15);
    setNewSubtaskInputs((prev) => ({ ...prev, [taskId]: '' }));
  };

  const handleStartFocus = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    updateFocusSession({
      taskId: task.id,
      isActive: true,
      timeLeftSeconds: 25 * 60,
      totalDurationSeconds: 25 * 60,
      mode: 'pomodoro',
    });
    setActiveView('focus');
    addToast(`Focus session started for "${task.title.slice(0, 25)}..."`, 'info');
  };

  const handleAiBreakdown = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgentDrawerOpen(true);
    addAgentMessage({
      sender: 'user',
      content: `Break down goal: ${task.title}`,
    });
    setAgentThinking(true);
    try {
      const res = await AIService.processUserMessage(`Break down goal: ${task.title}`);
      addAgentMessage({
        sender: 'agent',
        content: res.message,
        toolCalls: res.toolCalls,
      });
    } catch (err: any) {
      addAgentMessage({
        sender: 'system',
        content: `Breakdown error: ${err.message}`,
      });
    } finally {
      setAgentThinking(false);
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">URGENT</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-800 text-neutral-400 border border-white/10">LOW</span>;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Batch Action Bar */}
      {selectedTaskIds.length > 0 && (
        <div className="p-3 rounded-2xl glass-panel border-white/20 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-xs font-semibold text-white">
            {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                batchUpdateStatus(selectedTaskIds, 'done');
                setSelectedTaskIds([]);
              }}
              className="px-2.5 py-1 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold flex items-center space-x-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark Done</span>
            </button>
            <button
              onClick={() => {
                batchDeleteTasks(selectedTaskIds);
                setSelectedTaskIds([]);
              }}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 text-rose-400 border border-rose-500/30 hover:bg-neutral-800 text-xs font-semibold flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedTaskIds([])}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white text-xs border border-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task Cards List */}
      {filteredTasks.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center mx-auto text-neutral-400">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white">No tasks found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {filters.search || filters.priority !== 'all' || filters.timeframe !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'You have a clean slate! Create a task or ask the AI agent to plan your goals.'}
          </p>
          <button
            onClick={() => openTaskModal()}
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold shadow-lg shadow-white/10 transition-all"
          >
            + Create Task
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'done';
            const isExpanded = expandedTasks[task.id];
            const isSelected = selectedTaskIds.includes(task.id);
            const isOverdue = !isDone && task.dueDate && task.dueDate < todayStr;
            const isToday = !isDone && task.dueDate === todayStr;

            const completedSubtasks = task.subtasks.filter((st) => st.completed).length;
            const totalSubtasks = task.subtasks.length;
            const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

            const project = projects.find((p) => p.id === task.projectId);

            return (
              <div
                key={task.id}
                className={`glass-card rounded-2xl p-4 transition-all duration-200 ${
                  isDone ? 'opacity-60 bg-black/40' : ''
                } ${isSelected ? 'ring-1 ring-white bg-neutral-900/90' : ''}`}
              >
                {/* Main Task Header Row */}
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Left: Checkbox + Title + Metadata */}
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    
                    {/* Checkbox */}
                    <button
                      onClick={(e) => handleTaskCheck(task, e)}
                      className="mt-0.5 text-neutral-500 hover:text-emerald-400 transition-colors shrink-0"
                      aria-label="Toggle Completion"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 hover:text-emerald-400" />
                      )}
                    </button>

                    {/* Task Title & Details */}
                    <div
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => openTaskModal(task.id)}
                    >
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span
                          className={`text-sm font-semibold tracking-tight transition-all ${
                            isDone ? 'line-through text-neutral-500' : 'text-white hover:text-emerald-400'
                          }`}
                        >
                          {task.title}
                        </span>

                        {task.aiGenerated && (
                          <span className="px-1.5 py-0.2 rounded bg-neutral-900 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold flex items-center space-x-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>AI AGENT</span>
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Badges & Meta Row */}
                      <div className="flex items-center space-x-2 mt-2.5 flex-wrap gap-y-1.5 text-xs text-neutral-400">
                        {getPriorityBadge(task.priority)}

                        {/* Project Badge */}
                        {project && (
                          <span className="flex items-center space-x-1.5 text-[11px] font-medium text-neutral-300 px-2 py-0.5 rounded-md bg-neutral-900 border border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                            <span>{project.name}</span>
                          </span>
                        )}

                        {/* Due Date Badge */}
                        {task.dueDate && (
                          <span
                            className={`flex items-center space-x-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                              isOverdue
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : isToday
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-neutral-900 text-neutral-400 border border-white/10'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>
                              {isToday ? 'Today' : isOverdue ? `Overdue (${task.dueDate})` : task.dueDate}
                            </span>
                            {task.dueTime && <span>@{task.dueTime}</span>}
                          </span>
                        )}

                        {/* Estimated Time */}
                        {task.estimatedMinutes && (
                          <span className="flex items-center space-x-1 text-[11px] text-neutral-400 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimatedMinutes}m</span>
                          </span>
                        )}

                        {/* Tags */}
                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-white/10"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-1 shrink-0">
                    
                    {/* Focus Mode button */}
                    {!isDone && (
                      <button
                        onClick={(e) => handleStartFocus(task, e)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors border border-transparent hover:border-white/10"
                        title="Focus on this task with Pomodoro"
                      >
                        <Timer className="w-4 h-4" />
                      </button>
                    )}

                    {/* AI Decompose quick button */}
                    {totalSubtasks === 0 && !isDone && (
                      <button
                        onClick={(e) => handleAiBreakdown(task, e)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors border border-transparent hover:border-emerald-500/20"
                        title="AI Breakdown into Subtasks"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </button>
                    )}

                    {/* Expand Subtasks toggle */}
                    {totalSubtasks > 0 && (
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-mono text-neutral-400 hover:text-white hover:bg-neutral-900 border border-white/5 transition-colors"
                      >
                        <span>{completedSubtasks}/{totalSubtasks}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

                {/* Subtask Progress Bar if subtasks exist */}
                {totalSubtasks > 0 && (
                  <div className="mt-3 pt-2 border-t border-white/10">
                    <div className="w-full h-1 rounded-full bg-neutral-900 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                        style={{ width: `${subtaskPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Expanded Subtasks List */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2 pl-7 animate-in fade-in duration-150">
                    {task.subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between text-xs group"
                      >
                        <button
                          onClick={() => toggleSubtask(task.id, st.id)}
                          className="flex items-center space-x-2 text-left flex-1"
                        >
                          {st.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-neutral-500 hover:text-emerald-400 shrink-0" />
                          )}
                          <span
                            className={st.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}
                          >
                            {st.title}
                          </span>
                          {st.estimatedMinutes && (
                            <span className="text-[10px] text-neutral-400 font-mono">
                              ({st.estimatedMinutes}m)
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => deleteSubtask(task.id, st.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Inline Add Subtask */}
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add subtask and hit enter..."
                        value={newSubtaskInputs[task.id] || ''}
                        onChange={(e) =>
                          setNewSubtaskInputs((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddInlineSubtask(task.id);
                        }}
                        className="glass-input text-xs px-2.5 py-1 rounded-lg w-full placeholder:text-neutral-500"
                      />
                      <button
                        onClick={() => handleAddInlineSubtask(task.id)}
                        className="p-1 rounded-lg bg-neutral-900 text-neutral-300 hover:text-black hover:bg-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
