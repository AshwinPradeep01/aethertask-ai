import React from 'react';
import { useTaskStore } from './store/useTaskStore';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ListView } from './components/views/ListView';
import { KanbanView } from './components/views/KanbanView';
import { MatrixView } from './components/views/MatrixView';
import { FocusView } from './components/views/FocusView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { AgentDrawer } from './components/agent/AgentDrawer';
import { CommandPalette } from './components/agent/CommandPalette';
import { TaskModal } from './components/modals/TaskModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { Bot } from 'lucide-react';

export const App: React.FC = () => {
  const { activeView, isAgentDrawerOpen, setAgentDrawerOpen, openTaskModal } = useTaskStore();

  return (
    <div className="min-h-screen flex flex-col bg-surface-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {activeView === 'list' && <ListView />}
          {activeView === 'kanban' && <KanbanView />}
          {activeView === 'matrix' && <MatrixView />}
          {activeView === 'focus' && <FocusView />}
          {activeView === 'analytics' && <AnalyticsView />}
        </main>
      </div>

      {/* Floating Quick Agent Trigger Button for Mobile / Quick Access */}
      {!isAgentDrawerOpen && (
        <button
          onClick={() => setAgentDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-30 p-3.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white shadow-2xl shadow-brand-500/40 border border-white/20 transition-all hover:scale-110 active:scale-95 flex items-center space-x-2 group"
          title="Open AI Agent"
        >
          <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold hidden sm:inline pr-1">Ask Agent</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] -ml-1"></span>
        </button>
      )}

      {/* Modals & Overlays */}
      <AgentDrawer />
      <CommandPalette />
      <TaskModal />
      <SettingsModal />
      <ToastContainer />
    </div>
  );
};

export default App;
