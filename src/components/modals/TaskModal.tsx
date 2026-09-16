import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { Priority, TaskStatus, MatrixQuadrant, Subtask } from '../../types';
import {
  X,
  Trash2,
  Sparkles,
  CheckCircle2,
  Circle,
  Wand2
} from 'lucide-react';
import { AIService } from '../../services/aiService';

export const TaskModal: React.FC = () => {
  const {
    isTaskModalOpen,
    closeTaskModal,
    selectedTaskId,
    tasks,
    projects,
    addTask,
    updateTask,
    deleteTask,
    addToast,
  } = useTaskStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [quadrant, setQuadrant] = useState<MatrixQuadrant>('do_first');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [projectId, setProjectId] = useState('proj-work');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isDecomposing, setIsDecomposing] = useState(false);

  const isEditing = Boolean(selectedTaskId);

  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find((t) => t.id === selectedTaskId);
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setStatus(task.status);
        setQuadrant(task.quadrant);
        setDueDate(task.dueDate || '');
        setDueTime(task.dueTime || '');
        setEstimatedMinutes(task.estimatedMinutes || 30);
        setProjectId(task.projectId || 'proj-work');
        setTags(task.tags || []);
        setSubtasks(task.subtasks || []);
      }
    } else {
      // Defaults for new task
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setQuadrant('do_first');
      setDueDate(new Date().toISOString().split('T')[0]);
      setDueTime('');
      setEstimatedMinutes(30);
      setProjectId('proj-work');
      setTags(['General']);
      setSubtasks([]);
    }
  }, [selectedTaskId, isTaskModalOpen, tasks]);

  if (!isTaskModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && selectedTaskId) {
      updateTask(selectedTaskId, {
        title,
        description,
        priority,
        status,
        quadrant,
        dueDate,
        dueTime: dueTime || undefined,
        estimatedMinutes,
        projectId,
        tags,
        subtasks,
      });
      addToast('Task updated', 'success');
    } else {
      addTask({
        title,
        description,
        priority,
        status,
        quadrant,
        dueDate,
        dueTime: dueTime || undefined,
        estimatedMinutes,
        projectId,
        tags,
        subtasks,
      });
    }

    closeTaskModal();
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSt: Subtask = {
      id: 'st-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      title: newSubtaskTitle.trim(),
      completed: false,
      estimatedMinutes: 15,
    };
    setSubtasks([...subtasks, newSt]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (stId: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === stId ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleDeleteSubtask = (stId: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== stId));
  };

  // One-click AI Decomposition inside modal
  const handleAiDecomposeInModal = async () => {
    if (!title.trim()) {
      addToast('Enter a title first for AI to decompose', 'warning');
      return;
    }

    setIsDecomposing(true);
    try {
      const res = await AIService.processUserMessage(`Break down goal: ${title}`);
      if (res.toolCalls && res.toolCalls.length > 0) {
        const store = useTaskStore.getState();
        const createdId = res.toolCalls[0].affectedTaskIds?.[0];
        if (createdId) {
          const createdTask = store.tasks.find((t) => t.id === createdId);
          if (createdTask && createdTask.subtasks.length > 0) {
            setSubtasks([...subtasks, ...createdTask.subtasks]);
            addToast(`Generated ${createdTask.subtasks.length} subtasks with AI`, 'success');
            store.deleteTask(createdId);
          }
        }
      }
    } catch (err: any) {
      addToast(`AI Error: ${err.message}`, 'error');
    } finally {
      setIsDecomposing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl glass-panel rounded-3xl shadow-2xl overflow-hidden border border-white/15 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/60">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-white text-black">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-base font-bold text-white">
              {isEditing ? 'Edit Task' : 'Create New Task'}
            </h2>
          </div>

          <button
            onClick={closeTaskModal}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold font-mono text-neutral-300 uppercase tracking-wider">
              Task Title
            </label>
            <input
              type="text"
              placeholder="e.g. Launch product changelog and newsletter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input text-sm p-3 rounded-xl placeholder:text-neutral-500 font-medium"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold font-mono text-neutral-300 uppercase tracking-wider">
              Description & Notes
            </label>
            <textarea
              placeholder="Add extra context, deliverables or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full glass-input text-xs sm:text-sm p-3 rounded-xl placeholder:text-neutral-500"
            />
          </div>

          {/* Meta Grid (Priority, Status, Quadrant, Project) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-neutral-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full glass-input text-xs p-2 rounded-xl"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟡 High</option>
                <option value="medium">🟢 Medium</option>
                <option value="low">⚪ Low</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-neutral-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full glass-input text-xs p-2 rounded-xl"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Completed</option>
              </select>
            </div>

            {/* Eisenhower Quadrant */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-neutral-400">Eisenhower</label>
              <select
                value={quadrant}
                onChange={(e) => setQuadrant(e.target.value as MatrixQuadrant)}
                className="w-full glass-input text-xs p-2 rounded-xl"
              >
                <option value="do_first">I. Do First</option>
                <option value="schedule">II. Schedule</option>
                <option value="delegate">III. Delegate</option>
                <option value="eliminate">IV. Eliminate</option>
              </select>
            </div>

            {/* Project */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-neutral-400">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full glass-input text-xs p-2 rounded-xl"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Due Date, Time & Estimated Minutes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-neutral-400">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full glass-input text-xs p-2 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-neutral-400">Due Time (Optional)</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full glass-input text-xs p-2 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-neutral-400">Est. Effort (Minutes)</label>
              <input
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full glass-input text-xs p-2 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold font-mono text-neutral-300 uppercase tracking-wider">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-neutral-900 border border-white/10 min-h-[42px] items-center">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded-lg bg-white/10 text-white border border-white/10"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-emerald-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Type tag & hit Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="bg-transparent text-xs text-white placeholder:text-neutral-500 focus:outline-none px-1 flex-1 min-w-[120px]"
              />
            </div>
          </div>

          {/* Subtasks Section with AI Decomposer */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-mono text-neutral-300 uppercase tracking-wider">
                <span>Subtasks & Milestones ({subtasks.length})</span>
              </label>

              {/* AI Decompose Button */}
              <button
                type="button"
                onClick={handleAiDecomposeInModal}
                disabled={isDecomposing}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white text-black hover:bg-neutral-200 transition-all disabled:opacity-50 shadow-sm"
              >
                <Wand2 className={`w-3.5 h-3.5 text-emerald-600 ${isDecomposing ? 'animate-spin' : ''}`} />
                <span>{isDecomposing ? 'Decomposing...' : '✨ AI Decompose'}</span>
              </button>
            </div>

            {/* Subtask list */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-neutral-900 border border-white/10 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(st.id)}
                    className="flex items-center space-x-2 flex-1 text-left"
                  >
                    {st.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-neutral-500 hover:text-emerald-400 shrink-0" />
                    )}
                    <span className={st.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}>
                      {st.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(st.id)}
                    className="p-1 text-neutral-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add subtask title..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="glass-input text-xs p-2 rounded-xl flex-1 placeholder:text-neutral-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 rounded-xl bg-neutral-900 text-neutral-300 hover:text-black hover:bg-white transition-colors text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            {isEditing && selectedTaskId ? (
              <button
                type="button"
                onClick={() => {
                  deleteTask(selectedTaskId);
                  closeTaskModal();
                }}
                className="px-3 py-2 rounded-xl bg-neutral-900 text-rose-400 hover:bg-neutral-800 text-xs font-bold border border-rose-500/30 flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            ) : <span />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={closeTaskModal}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-300 hover:text-white text-xs font-semibold border border-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold shadow-lg shadow-white/10"
              >
                {isEditing ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
