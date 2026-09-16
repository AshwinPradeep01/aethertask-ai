import React, { useState, useRef, useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { AIService } from '../../services/aiService';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Mic,
  MicOff,
  Trash2,
  CheckCircle,
  ArrowRight,
  Wand2
} from 'lucide-react';

export const AgentDrawer: React.FC = () => {
  const {
    isAgentDrawerOpen,
    setAgentDrawerOpen,
    agentMessages,
    addAgentMessage,
    isAgentThinking,
    setAgentThinking,
    clearAgentChat,
    openTaskModal,
  } = useTaskStore();

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAgentDrawerOpen) {
      scrollToBottom();
    }
  }, [agentMessages, isAgentThinking, isAgentDrawerOpen]);

  // Handle Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isAgentThinking) return;

    setInput('');
    addAgentMessage({
      sender: 'user',
      content: textToSend,
    });

    setAgentThinking(true);

    try {
      const result = await AIService.processUserMessage(textToSend);
      addAgentMessage({
        sender: 'agent',
        content: result.message,
        toolCalls: result.toolCalls,
      });
    } catch (err: any) {
      addAgentMessage({
        sender: 'system',
        content: `Error running agent: ${err?.message || 'Unknown error occurred'}`,
      });
    } finally {
      setAgentThinking(false);
    }
  };

  if (!isAgentDrawerOpen) return null;

  const quickPrompts = [
    { label: 'Break down a goal', prompt: 'Break down launching a SaaS MVP into actionable subtasks' },
    { label: 'Reschedule overdue', prompt: 'Reschedule all overdue tasks to today' },
    { label: 'Focus briefing', prompt: 'What should I focus on today?' },
    { label: 'Eisenhower balance', prompt: 'Reorganize my tasks using the Eisenhower matrix' },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[440px] glass-panel shadow-2xl flex flex-col border-l border-white/10 animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/80 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/10">
            <Bot className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <span>Task Agent</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </h2>
            <p className="text-[11px] text-neutral-400">Autonomous task planning & triage</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={clearAgentChat}
            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-900 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAgentDrawerOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-b border-white/10 bg-black/50 flex items-center space-x-1.5 overflow-x-auto text-xs no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.prompt)}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-white hover:text-black text-neutral-300 border border-white/10 transition-colors flex items-center space-x-1 font-medium"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {agentMessages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          const isSystem = msg.sender === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="p-3 rounded-xl bg-neutral-900 border border-rose-500/30 text-xs text-rose-400">
                {msg.content}
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isAgent
                    ? 'bg-neutral-900 border border-white/10 text-neutral-200 rounded-tl-sm shadow-md'
                    : 'bg-white text-black font-medium rounded-tr-sm shadow-md shadow-white/10'
                }`}
              >
                {/* Message Content with basic Markdown formatting */}
                <div className="space-y-2 whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Tool Execution Badges */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 flex items-center space-x-1">
                      <Wand2 className="w-3 h-3" />
                      <span>Tools Executed</span>
                    </p>
                    {msg.toolCalls.map((tc, tcIdx) => (
                      <div
                        key={tcIdx}
                        className="p-2.5 rounded-xl bg-black border border-white/10 text-xs flex flex-col space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono text-[11px] text-emerald-400">
                          <span className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span>{tc.toolName}()</span>
                          </span>
                          <span className="text-[10px] text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-white/5">
                            {tc.status}
                          </span>
                        </div>
                        {tc.resultSummary && (
                          <p className="text-neutral-300 text-[11px]">{tc.resultSummary}</p>
                        )}
                        {tc.affectedTaskIds && tc.affectedTaskIds.length > 0 && (
                          <div className="pt-1 flex items-center space-x-2">
                            <button
                              onClick={() => openTaskModal(tc.affectedTaskIds![0])}
                              className="text-[10px] font-semibold text-emerald-400 hover:underline flex items-center space-x-1"
                            >
                              <span>View Generated Task</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-neutral-400 font-mono px-1 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {isAgentThinking && (
          <div className="flex items-center space-x-2 p-3 rounded-2xl bg-neutral-900 border border-white/10 text-xs text-emerald-400 max-w-[70%] font-mono">
            <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Agent planning & executing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-white/10 bg-black/80 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            placeholder={isListening ? 'Listening to your voice...' : 'Ask agent to break down tasks, reschedule...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full glass-input text-xs sm:text-sm pl-4 pr-20 py-2.5 rounded-xl text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-emerald-500"
          />

          <div className="absolute right-1.5 flex items-center space-x-1">
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-1.5 rounded-lg transition-colors ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Voice Input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isAgentThinking}
              className="p-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-white shadow-md transition-all"
            >
              <Send className="w-4 h-4 text-black" />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
