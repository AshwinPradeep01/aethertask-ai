import { create } from 'zustand';
import { Task, Subtask, Project, ViewMode, TaskFilters, AgentMessage, AIProviderConfig, FocusSession, Priority, TaskStatus, MatrixQuadrant } from '../types';

interface ToastInfo {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface TaskState {
  tasks: Task[];
  projects: Project[];
  activeView: ViewMode;
  filters: TaskFilters;
  selectedTaskId: string | null;
  isTaskModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isAgentDrawerOpen: boolean;
  isCommandPaletteOpen: boolean;
  aiConfig: AIProviderConfig;
  agentMessages: AgentMessage[];
  isAgentThinking: boolean;
  focusSession: FocusSession;
  toasts: ToastInfo[];

  // Task Actions
  addTask: (taskData: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  addSubtask: (taskId: string, title: string, estimatedMinutes?: number) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  batchUpdateStatus: (taskIds: string[], status: TaskStatus) => void;
  batchDeleteTasks: (taskIds: string[]) => void;
  rescheduleOverdueTasks: (newDateStr?: string) => number;
  importTasks: (tasks: Task[]) => void;
  resetToSampleData: () => void;

  // View & UI Actions
  setActiveView: (view: ViewMode) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;
  openTaskModal: (taskId?: string | null) => void;
  closeTaskModal: () => void;
  setSettingsModalOpen: (open: boolean) => void;
  setAgentDrawerOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setAiConfig: (config: Partial<AIProviderConfig>) => void;

  // Agent Chat Actions
  addAgentMessage: (message: Omit<AgentMessage, 'id' | 'timestamp'>) => void;
  setAgentThinking: (thinking: boolean) => void;
  clearAgentChat: () => void;

  // Focus Session Actions
  updateFocusSession: (updates: Partial<FocusSession>) => void;
  tickFocusTimer: () => void;

  // Toast Actions
  addToast: (message: string, type?: ToastInfo['type']) => void;
  removeToast: (id: string) => void;
}

const STORAGE_KEY = 'aether_task_agent_data_v1';
const AI_CONFIG_KEY = 'aether_task_agent_ai_config_v1';

const getInitialProjects = (): Project[] => [
  { id: 'proj-work', name: 'Work & Projects', color: '#6366f1', icon: 'Briefcase' },
  { id: 'proj-personal', name: 'Personal & Health', color: '#10b981', icon: 'Heart' },
  { id: 'proj-learning', name: 'Learning & AI', color: '#f59e0b', icon: 'Sparkles' },
];

const getTodayString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const getSampleTasks = (): Task[] => [
  {
    id: 't-1',
    title: 'Architect autonomous agent tool execution pipeline',
    description: 'Design structured JSON schema tool calls for natural language task triage and autonomous scheduling.',
    status: 'in_progress',
    priority: 'urgent',
    quadrant: 'do_first',
    dueDate: getTodayString(0),
    dueTime: '15:00',
    tags: ['AI', 'Architecture', 'Agent'],
    subtasks: [
      { id: 'st-1-1', title: 'Define Tool Call schema definitions', completed: true, estimatedMinutes: 20 },
      { id: 'st-1-2', title: 'Implement dynamic client-side fallback executor', completed: true, estimatedMinutes: 30 },
      { id: 'st-1-3', title: 'Connect Gemini & OpenAI function calling endpoints', completed: false, estimatedMinutes: 25 },
    ],
    estimatedMinutes: 75,
    actualMinutes: 45,
    projectId: 'proj-work',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
    aiGenerated: false,
  },
  {
    id: 't-2',
    title: 'Review user feedback & prioritize roadmap',
    description: 'Aggregate user survey responses and categorize requested features by impact and complexity.',
    status: 'todo',
    priority: 'high',
    quadrant: 'schedule',
    dueDate: getTodayString(1),
    dueTime: '11:00',
    tags: ['Product', 'Strategy'],
    subtasks: [
      { id: 'st-2-1', title: 'Export feedback matrix into spreadsheet', completed: false, estimatedMinutes: 15 },
      { id: 'st-2-2', title: 'Draft Q3 milestone board', completed: false, estimatedMinutes: 30 },
    ],
    estimatedMinutes: 45,
    projectId: 'proj-work',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-3',
    title: 'Morning 5km endurance run & hydration',
    description: 'Keep regular cardiovascular conditioning routine.',
    status: 'done',
    priority: 'medium',
    quadrant: 'do_first',
    dueDate: getTodayString(0),
    tags: ['Fitness', 'Health'],
    subtasks: [
      { id: 'st-3-1', title: 'Warm-up dynamic stretching', completed: true, estimatedMinutes: 10 },
      { id: 'st-3-2', title: '5km jog at 5:30/km pace', completed: true, estimatedMinutes: 30 },
    ],
    estimatedMinutes: 40,
    actualMinutes: 40,
    completedAt: new Date().toISOString(),
    projectId: 'proj-personal',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-4',
    title: 'Study paper: Scalable Agent Alignment with Tool Reflection',
    description: 'Read and take synthesis notes on multi-turn autonomous tool execution patterns.',
    status: 'todo',
    priority: 'medium',
    quadrant: 'schedule',
    dueDate: getTodayString(2),
    tags: ['Research', 'AI'],
    subtasks: [
      { id: 'st-4-1', title: 'Read methodology & benchmark section', completed: false, estimatedMinutes: 30 },
      { id: 'st-4-2', title: 'Implement sample reflection loop test', completed: false, estimatedMinutes: 45 },
    ],
    estimatedMinutes: 75,
    projectId: 'proj-learning',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    aiGenerated: true,
  },
  {
    id: 't-5',
    title: 'Clean up stale email inbox subscriptions',
    description: 'Unsubscribe from unread promotional newsletters.',
    status: 'todo',
    priority: 'low',
    quadrant: 'eliminate',
    dueDate: getTodayString(-1), // overdue for demo
    tags: ['Admin', 'Declutter'],
    subtasks: [],
    estimatedMinutes: 20,
    projectId: 'proj-personal',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const loadTasksFromStorage = (): Task[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load tasks from localStorage', e);
  }
  return getSampleTasks();
};

const loadAiConfigFromStorage = (): AIProviderConfig => {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load AI config', e);
  }
  return {
    provider: 'mock',
    modelName: 'gemini-1.5-flash',
    temperature: 0.7,
  };
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: loadTasksFromStorage(),
  projects: getInitialProjects(),
  activeView: 'list',
  filters: {
    search: '',
    priority: 'all',
    status: 'all',
    tag: 'all',
    projectId: 'all',
    timeframe: 'all',
  },
  selectedTaskId: null,
  isTaskModalOpen: false,
  isSettingsModalOpen: false,
  isAgentDrawerOpen: false,
  isCommandPaletteOpen: false,
  aiConfig: loadAiConfigFromStorage(),
  agentMessages: [
    {
      id: 'msg-welcome',
      sender: 'agent',
      content: 'Hello! I am your **Autonomous To-Do Agent**. I can break down large goals, reschedule overdue items, prioritize tasks using the Eisenhower matrix, or answer questions about your productivity. Try typing `"Break down launch marketing strategy"` or `"Reschedule overdue tasks"`.',
      timestamp: new Date().toISOString(),
    }
  ],
  isAgentThinking: false,
  focusSession: {
    isActive: false,
    mode: 'pomodoro',
    timeLeftSeconds: 25 * 60,
    totalDurationSeconds: 25 * 60,
    completedPomodoros: 0,
    soundEnabled: false,
    soundType: 'none',
  },
  toasts: [],

  // Task Actions
  addTask: (taskData) => {
    const newTask: Task = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      quadrant: taskData.quadrant || 'do_first',
      dueDate: taskData.dueDate || getTodayString(0),
      dueTime: taskData.dueTime,
      tags: taskData.tags || [],
      subtasks: taskData.subtasks || [],
      estimatedMinutes: taskData.estimatedMinutes || 30,
      projectId: taskData.projectId || 'proj-work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiGenerated: taskData.aiGenerated || false,
    };

    set((state) => {
      const updated = [newTask, ...state.tasks];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { tasks: updated };
    });

    get().addToast(`Task "${newTask.title.slice(0, 30)}..." added`, 'success');
    return newTask;
  },

  updateTask: (id, updates) => {
    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id === id) {
          const isCompleting = updates.status === 'done' && t.status !== 'done';
          const completedAt = isCompleting ? new Date().toISOString() : updates.status && updates.status !== 'done' ? undefined : t.completedAt;
          return {
            ...t,
            ...updates,
            completedAt,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { tasks: updated };
    });
  },

  deleteTask: (id) => {
    set((state) => {
      const task = state.tasks.find((t) => t.id === id);
      const updated = state.tasks.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (task) {
        get().addToast(`Deleted "${task.title.slice(0, 25)}..."`, 'info');
      }
      return { tasks: updated, selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId };
    });
  },

  toggleTaskCompletion: (id) => {
    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id === id) {
          const isDone = t.status === 'done';
          const nextStatus: TaskStatus = isDone ? 'todo' : 'done';
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'done' ? new Date().toISOString() : undefined,
            subtasks: t.subtasks.map((st) => ({ ...st, completed: nextStatus === 'done' })),
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { tasks: updated };
    });
  },

  addSubtask: (taskId, title, estimatedMinutes) => {
    const newSubtask: Subtask = {
      id: 'st-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      title,
      completed: false,
      estimatedMinutes,
    };

    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: [...t.subtasks, newSubtask],
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { tasks: updated };
    });
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id === taskId) {
          const newSubtasks = t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const allCompleted = newSubtasks.length > 0 && newSubtasks.every((st) => st.completed);
          const nextStatus: TaskStatus = allCompleted ? 'done' : (t.status === 'done' ? 'in_progress' : t.status);
          return {
            ...t,
            subtasks: newSubtasks,
            status: nextStatus,
            completedAt: allCompleted ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { tasks: updated };
    });
  },

  deleteSubtask: (taskId, subtaskId) => {
    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { tasks: updated };
    });
  },

  batchUpdateStatus: (taskIds, status) => {
    set((state) => {
      const updated = state.tasks.map((t) => {
        if (taskIds.includes(t.id)) {
          return {
            ...t,
            status,
            completedAt: status === 'done' ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { tasks: updated };
    });
    get().addToast(`Updated ${taskIds.length} tasks to ${status}`, 'success');
  },

  batchDeleteTasks: (taskIds) => {
    set((state) => {
      const updated = state.tasks.filter((t) => !taskIds.includes(t.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { tasks: updated };
    });
    get().addToast(`Deleted ${taskIds.length} tasks`, 'info');
  },

  rescheduleOverdueTasks: (newDateStr = getTodayString(0)) => {
    const today = getTodayString(0);
    let count = 0;

    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.status !== 'done' && t.dueDate && t.dueDate < today) {
          count++;
          return {
            ...t,
            dueDate: newDateStr,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { tasks: updated };
    });

    if (count > 0) {
      get().addToast(`Rescheduled ${count} overdue tasks to ${newDateStr}`, 'success');
    }
    return count;
  },

  importTasks: (importedTasks) => {
    set((state) => {
      // deduplicate by id
      const existingIds = new Set(state.tasks.map((t) => t.id));
      const fresh = importedTasks.filter((t) => !existingIds.has(t.id));
      const merged = [...fresh, ...state.tasks];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return { tasks: merged };
    });
    get().addToast(`Successfully imported ${importedTasks.length} tasks`, 'success');
  },

  resetToSampleData: () => {
    const sample = getSampleTasks();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
    set({ tasks: sample });
    get().addToast('Reset to demo sample tasks', 'info');
  },

  // View & UI Actions
  setActiveView: (view) => set({ activeView: view }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () =>
    set({
      filters: {
        search: '',
        priority: 'all',
        status: 'all',
        tag: 'all',
        projectId: 'all',
        timeframe: 'all',
      },
    }),

  openTaskModal: (taskId = null) => set({ selectedTaskId: taskId, isTaskModalOpen: true }),
  closeTaskModal: () => set({ selectedTaskId: null, isTaskModalOpen: false }),
  setSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),
  setAgentDrawerOpen: (open) => set({ isAgentDrawerOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  setAiConfig: (config) => {
    set((state) => {
      const updated = { ...state.aiConfig, ...config };
      localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(updated));
      return { aiConfig: updated };
    });
    get().addToast('AI configuration saved', 'success');
  },

  // Agent Chat Actions
  addAgentMessage: (message) => {
    const newMsg: AgentMessage = {
      ...message,
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ agentMessages: [...state.agentMessages, newMsg] }));
  },

  setAgentThinking: (thinking) => set({ isAgentThinking: thinking }),
  clearAgentChat: () =>
    set({
      agentMessages: [
        {
          id: 'msg-cleared',
          sender: 'agent',
          content: 'Chat context reset. How can I assist with your tasks today?',
          timestamp: new Date().toISOString(),
        },
      ],
    }),

  // Focus Session Actions
  updateFocusSession: (updates) =>
    set((state) => ({ focusSession: { ...state.focusSession, ...updates } })),

  tickFocusTimer: () => {
    set((state) => {
      const { focusSession } = state;
      if (!focusSession.isActive || focusSession.timeLeftSeconds <= 0) {
        return state;
      }
      const nextTime = focusSession.timeLeftSeconds - 1;
      if (nextTime <= 0) {
        const nextMode = focusSession.mode === 'pomodoro' ? 'short_break' : 'pomodoro';
        const nextDuration = nextMode === 'pomodoro' ? 25 * 60 : 5 * 60;
        get().addToast(
          focusSession.mode === 'pomodoro'
            ? '🎉 Pomodoro completed! Take a 5-minute breather.'
            : '⏰ Break finished! Ready to focus?',
          'success'
        );
        return {
          focusSession: {
            ...focusSession,
            mode: nextMode,
            isActive: false,
            timeLeftSeconds: nextDuration,
            totalDurationSeconds: nextDuration,
            completedPomodoros:
              focusSession.mode === 'pomodoro'
                ? focusSession.completedPomodoros + 1
                : focusSession.completedPomodoros,
          },
        };
      }
      return {
        focusSession: {
          ...focusSession,
          timeLeftSeconds: nextTime,
        },
      };
    });
  },

  // Toast Actions
  addToast: (message, type = 'info') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
