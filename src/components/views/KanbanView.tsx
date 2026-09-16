import React from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { Task, TaskStatus, Priority } from '../../types';
import confetti from 'canvas-confetti';
import {
  Plus,
  Sparkles,
  Calendar,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export const KanbanView: React.FC = () => {
  const {
    tasks,
    projects,
    filters,
    updateTask,
    openTaskModal,
  } = useTaskStore();

  const columns: { id: TaskStatus; title: string; badge: string; border: string }[] = [
    { id: 'todo', title: 'To Do', badge: 'bg-neutral-900 text-neutral-300 border border-white/10', border: 'border-white/10' },
    { id: 'in_progress', title: 'In Progress', badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30', border: 'border-emerald-500/30' },
    { id: 'review', title: 'In Review', badge: 'bg-white/10 text-white border border-white/20', border: 'border-white/15' },
    { id: 'done', title: 'Completed', badge: 'bg-neutral-900 text-neutral-400 border border-white/10', border: 'border-white/10' },
  ];

  const getPriorityDot = (p: Priority) => {
    switch (p) {
      case 'urgent': return 'bg-rose-500 shadow-[0_0_8px_#f43f5e]';
      case 'high': return 'bg-amber-400';
      case 'medium': return 'bg-emerald-400';
      default: return 'bg-neutral-600';
    }
  };

  const getFilteredTasks = (status: TaskStatus) => {
    return tasks.filter((t) => {
      if (t.status !== status) return false;
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
        if (!matchTitle && !matchTag) return false;
      }
      if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
      if (filters.projectId !== 'all' && t.projectId !== filters.projectId) return false;
      return true;
    });
  };

  const handleMoveColumn = (task: Task, targetStatus: TaskStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask(task.id, { status: targetStatus });

    if (targetStatus === 'done') {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#ffffff', '#10b981', '#34d399'],
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full pb-8 items-start">
      {columns.map((col) => {
        const columnTasks = getFilteredTasks(col.id);

        return (
          <div
            key={col.id}
            className={`glass-panel rounded-2xl p-4 flex flex-col max-h-[calc(100vh-8rem)] ${col.border}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold ${col.badge}`}>
                  {col.title}
                </span>
                <span className="text-xs text-neutral-400 font-mono font-semibold">{columnTasks.length}</span>
              </div>
              <button
                onClick={() => openTaskModal()}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
                title={`Add task to ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards in Column */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {columnTasks.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-white/10 rounded-xl text-neutral-600 text-xs">
                  No tasks in {col.title}
                </div>
              ) : (
                columnTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const totalSt = task.subtasks.length;
                  const doneSt = task.subtasks.filter((s) => s.completed).length;

                  return (
                    <div
                      key={task.id}
                      onClick={() => openTaskModal(task.id)}
                      className="glass-card rounded-xl p-3.5 cursor-pointer hover:border-emerald-500/40 space-y-2.5 group transition-all"
                    >
                      {/* Priority dot & Project */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`} />
                          {project && (
                            <span className="text-[10px] font-medium text-neutral-400 truncate max-w-[100px]">
                              {project.name}
                            </span>
                          )}
                        </div>
                        {task.aiGenerated && (
                          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-neutral-900 border border-emerald-500/30 px-1 rounded flex items-center space-x-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>AI</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-xs font-semibold leading-snug ${
                          task.status === 'done' ? 'line-through text-neutral-500' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Subtasks summary */}
                      {totalSt > 0 && (
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 font-mono">
                          <span>Subtasks</span>
                          <span>{doneSt}/{totalSt}</span>
                        </div>
                      )}

                      {/* Card Footer / Move controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-neutral-400">
                        {task.dueDate ? (
                          <div className="flex items-center space-x-1 font-mono">
                            <Calendar className="w-3 h-3 text-neutral-500" />
                            <span>{task.dueDate}</span>
                          </div>
                        ) : (
                          <span />
                        )}

                        {/* Move Buttons */}
                        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                          {col.id !== 'todo' && (
                            <button
                              onClick={(e) => {
                                const prevStatus: Record<TaskStatus, TaskStatus> = {
                                  todo: 'todo',
                                  in_progress: 'todo',
                                  review: 'in_progress',
                                  done: 'review',
                                };
                                handleMoveColumn(task, prevStatus[col.id], e);
                              }}
                              className="p-1 hover:text-white rounded hover:bg-neutral-800"
                              title="Move back"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          {col.id !== 'done' && (
                            <button
                              onClick={(e) => {
                                const nextStatus: Record<TaskStatus, TaskStatus> = {
                                  todo: 'in_progress',
                                  in_progress: 'review',
                                  review: 'done',
                                  done: 'done',
                                };
                                handleMoveColumn(task, nextStatus[col.id], e);
                              }}
                              className="p-1 hover:text-white rounded hover:bg-neutral-800"
                              title="Advance forward"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};
