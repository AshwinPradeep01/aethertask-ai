import React, { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { AIService } from '../../services/aiService';
import {
  Search,
  Plus,
  Bot,
  Calendar,
  CheckCircle2,
  Timer,
  Download,
  Sparkles,
  Command,
  ArrowRight,
  X
} from 'lucide-react';
import { ExportService } from '../../services/exportService';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    tasks,
    openTaskModal,
    setActiveView,
    setAgentDrawerOpen,
    addAgentMessage,
    setAgentThinking,
  } = useTaskStore();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keydown listener for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 6);

  const handleCreateTaskFromPrompt = () => {
    if (!query.trim()) return;
    openTaskModal();
    setCommandPaletteOpen(false);
  };

  const handleAskAgent = async () => {
    if (!query.trim()) return;
    setCommandPaletteOpen(false);
    setAgentDrawerOpen(true);

    addAgentMessage({
      sender: 'user',
      content: query,
    });

    setAgentThinking(true);
    try {
      const res = await AIService.processUserMessage(query);
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl glass-panel rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center space-x-3 bg-surface-900/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, task name, or ask the agent..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (query.toLowerCase().startsWith('ask ') || query.toLowerCase().startsWith('agent:')) {
                  handleAskAgent();
                } else if (filteredTasks.length === 1) {
                  openTaskModal(filteredTasks[0].id);
                  setCommandPaletteOpen(false);
                } else {
                  handleCreateTaskFromPrompt();
                }
              }
            }}
            className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results / Commands List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {query.trim() && (
            <div className="p-1 space-y-1">
              <button
                onClick={handleAskAgent}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-brand-300 hover:bg-brand-500/20 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Bot className="w-4 h-4 text-brand-400" />
                  <span>Ask Agent: &quot;{query}&quot;</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleCreateTaskFromPrompt}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Create new task &quot;{query}&quot;</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}

          {/* Matching Tasks */}
          {filteredTasks.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-3 pb-1">
                Tasks
              </p>
              {filteredTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    openTaskModal(task.id);
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${task.status === 'done' ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                    />
                    <span className="font-medium text-slate-200 truncate">{task.title}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-surface-800 shrink-0">
                    {task.priority}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Nav Actions */}
          <div className="pt-2">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-3 pb-1">
              Quick Shortcuts
            </p>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => {
                  setActiveView('focus');
                  setCommandPaletteOpen(false);
                }}
                className="flex items-center space-x-2 p-2 rounded-xl text-xs text-slate-300 hover:bg-white/5"
              >
                <Timer className="w-4 h-4 text-indigo-400" />
                <span>Open Focus Pomodoro</span>
              </button>
              <button
                onClick={() => {
                  setAgentDrawerOpen(true);
                  setCommandPaletteOpen(false);
                }}
                className="flex items-center space-x-2 p-2 rounded-xl text-xs text-slate-300 hover:bg-white/5"
              >
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Open AI Assistant</span>
              </button>
              <button
                onClick={() => {
                  ExportService.exportToMarkdown(tasks);
                  setCommandPaletteOpen(false);
                }}
                className="flex items-center space-x-2 p-2 rounded-xl text-xs text-slate-300 hover:bg-white/5"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Export Markdown</span>
              </button>
              <button
                onClick={() => {
                  ExportService.exportToJson(tasks);
                  setCommandPaletteOpen(false);
                }}
                className="flex items-center space-x-2 p-2 rounded-xl text-xs text-slate-300 hover:bg-white/5"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Export JSON Backup</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/5 bg-surface-950/60 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <span>Tip: Type <kbd className="px-1 py-0.5 rounded bg-surface-800 text-slate-300 font-mono">ask [question]</kbd> to query the agent</span>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-800 text-slate-300 font-mono text-[10px]">ESC</kbd>
            <span>to close</span>
          </div>
        </div>

      </div>
    </div>
  );
};
