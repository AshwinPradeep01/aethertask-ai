import React from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { ViewMode } from '../../types';
import {
  Sparkles,
  Plus,
  Search,
  LayoutList,
  Columns3,
  Grid2x2,
  Timer,
  BarChart3,
  Settings,
  Download,
  Bot,
  Command
} from 'lucide-react';
import { ExportService } from '../../services/exportService';

export const Navbar: React.FC = () => {
  const {
    tasks,
    activeView,
    setActiveView,
    filters,
    setFilters,
    openTaskModal,
    setSettingsModalOpen,
    setAgentDrawerOpen,
    isAgentDrawerOpen,
    setCommandPaletteOpen
  } = useTaskStore();

  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'list', label: 'List', icon: <LayoutList className="w-4 h-4" /> },
    { id: 'kanban', label: 'Kanban', icon: <Columns3 className="w-4 h-4" /> },
    { id: 'matrix', label: 'Eisenhower', icon: <Grid2x2 className="w-4 h-4" /> },
    { id: 'focus', label: 'Focus', icon: <Timer className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-black/90 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Status */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse-subtle" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Aether<span className="text-emerald-400">Task</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Agentic AI
              </span>
            </div>
          </div>
        </div>

        {/* Search & Command Shortcut Bar */}
        <div className="flex-1 max-w-md hidden md:flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search tasks, tags, or press Ctrl+K..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full glass-input text-xs sm:text-sm pl-9 pr-14 py-2 rounded-xl placeholder:text-neutral-500 text-white focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-neutral-900 text-[11px] text-neutral-400 border border-white/10 hover:text-white"
              title="Open Command Palette"
            >
              <Command className="w-3 h-3" />
              <span>K</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="hidden lg:flex items-center p-1 rounded-xl bg-neutral-900 border border-white/10">
          {views.map((v) => {
            const isActive = activeView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-black shadow-md shadow-white/10'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {v.icon}
                <span>{v.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions & Agent Trigger */}
        <div className="flex items-center space-x-2">
          
          {/* AI Agent Drawer Trigger Button */}
          <button
            onClick={() => setAgentDrawerOpen(!isAgentDrawerOpen)}
            className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              isAgentDrawerOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                : 'glass-panel text-neutral-300 border-white/10 hover:border-emerald-500/40 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">AI Agent</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
          </button>

          {/* Quick Add Task Button */}
          <button
            onClick={() => openTaskModal()}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-black" />
            <span className="hidden sm:inline">New Task</span>
          </button>

          {/* Export Dropdown / Button */}
          <button
            onClick={() => ExportService.exportToMarkdown(tasks)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-white/10 transition-colors"
            title="Export tasks to Markdown"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-white/10 transition-colors"
            title="Settings & AI Model"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
