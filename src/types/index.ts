export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type MatrixQuadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  quadrant: MatrixQuadrant;
  dueDate?: string; // ISO date string or YYYY-MM-DD
  dueTime?: string; // HH:mm
  tags: string[];
  subtasks: Subtask[];
  estimatedMinutes?: number;
  actualMinutes?: number;
  projectId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  aiGenerated?: boolean;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export type ViewMode = 'list' | 'kanban' | 'matrix' | 'focus' | 'analytics';

export type FilterTimeframe = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export interface TaskFilters {
  search: string;
  priority: Priority | 'all';
  status: TaskStatus | 'all';
  tag: string | 'all';
  projectId: string | 'all';
  timeframe: FilterTimeframe;
}

export interface AgentMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: AgentToolExecution[];
}

export interface AgentToolExecution {
  toolName: string;
  description: string;
  status: 'success' | 'failed' | 'running';
  resultSummary?: string;
  affectedTaskIds?: string[];
}

export interface AIProviderConfig {
  provider: 'mock' | 'gemini' | 'openai';
  geminiApiKey?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  modelName?: string;
  temperature?: number;
}

export interface FocusSession {
  isActive: boolean;
  taskId?: string;
  mode: 'pomodoro' | 'short_break' | 'long_break';
  timeLeftSeconds: number;
  totalDurationSeconds: number;
  completedPomodoros: number;
  soundEnabled: boolean;
  soundType: 'none' | 'whitenoise' | 'rain' | 'binaural';
}
