import React, { useState, useRef } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { ExportService } from '../../services/exportService';
import {
  X,
  Bot,
  Database,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setSettingsModalOpen,
    aiConfig,
    setAiConfig,
    tasks,
    importTasks,
    resetToSampleData,
    addToast,
  } = useTaskStore();

  const [provider, setProvider] = useState(aiConfig.provider);
  const [geminiApiKey, setGeminiApiKey] = useState(aiConfig.geminiApiKey || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(aiConfig.openaiApiKey || '');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState(aiConfig.openaiBaseUrl || 'https://api.openai.com/v1');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isSettingsModalOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setAiConfig({
      provider,
      geminiApiKey,
      openaiApiKey,
      openaiBaseUrl,
    });
    setSettingsModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (Array.isArray(data)) {
          importTasks(data);
        } else {
          addToast('Invalid JSON task backup file format', 'error');
        }
      } catch (err) {
        addToast('Failed to parse JSON file', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl glass-panel rounded-3xl shadow-2xl overflow-hidden border border-white/15 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/60">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-white text-black">
              <Bot className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-base font-bold text-white">Settings & AI Configuration</h2>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveSettings} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* AI Provider Mode */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <label className="text-xs font-bold font-mono text-neutral-300 uppercase tracking-wider">
                AI Engine & Provider
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'mock', label: 'Offline Agent', desc: 'Built-in heuristics' },
                { id: 'gemini', label: 'Google Gemini', desc: 'Gemini 1.5 Flash' },
                { id: 'openai', label: 'OpenAI / Custom', desc: 'GPT-4o or endpoint' },
              ].map((p) => {
                const isSelected = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id as any)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-white text-black shadow-lg shadow-white/10'
                        : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <p className={`text-xs font-bold ${isSelected ? 'text-black' : 'text-neutral-200'}`}>{p.label}</p>
                    <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}>{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gemini API Key */}
          {provider === 'gemini' && (
            <div className="space-y-2 p-4 rounded-2xl bg-neutral-900 border border-white/10 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">Gemini API Key</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-400 hover:underline font-mono"
                >
                  Get Free Key →
                </a>
              </div>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full glass-input text-xs p-2.5 rounded-xl font-mono"
              />
              <p className="text-[10px] text-neutral-400">
                Your key stays strictly in your browser&apos;s localStorage and is sent directly to Google.
              </p>
            </div>
          )}

          {/* OpenAI API Key */}
          {provider === 'openai' && (
            <div className="space-y-3 p-4 rounded-2xl bg-neutral-900 border border-white/10 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">OpenAI API Key</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  className="w-full glass-input text-xs p-2.5 rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Base URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={openaiBaseUrl}
                  onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                  className="w-full glass-input text-xs p-2.5 rounded-xl font-mono"
                />
              </div>
            </div>
          )}

          {/* Backup, Import & Export Data */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-white" />
              <label className="text-xs font-bold font-mono text-neutral-300 uppercase tracking-wider">
                Backup & Data Management
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => ExportService.exportToMarkdown(tasks)}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs text-neutral-300 font-semibold flex items-center space-x-2"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Export Markdown</span>
              </button>

              <button
                type="button"
                onClick={() => ExportService.exportToJson(tasks)}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs text-neutral-300 font-semibold flex items-center space-x-2"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => ExportService.exportToIcs(tasks)}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs text-neutral-300 font-semibold flex items-center space-x-2"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export iCal (.ics)</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs text-neutral-300 font-semibold flex items-center space-x-2"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Import JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={resetToSampleData}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 border border-white/10 text-xs font-semibold flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Demo Tasks</span>
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-neutral-900 border border-white/10 text-xs text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Your data is stored 100% locally in your browser. No account registration or tracking cookies required.
            </p>
          </div>

          {/* Footer Save */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setSettingsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-300 hover:text-white text-xs font-semibold border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold shadow-lg shadow-white/10"
            >
              Save Configuration
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
