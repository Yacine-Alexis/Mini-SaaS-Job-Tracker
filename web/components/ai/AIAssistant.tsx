'use client';

/**
 * AIAssistant - A subtle, floating AI assistant chat widget.
 * Provides smart insights and answers questions about job search.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  SparklesIcon,
  SendIcon,
  CloseIcon,
  ChevronDownIcon,
  SpinnerIcon,
  ExternalLinkIcon,
  LightbulbIcon,
} from '@/components/icons';

interface AssistantResponse {
  message: string;
  suggestions?: string[];
  resources?: { name: string; url: string; specialty: string }[];
  data?: Record<string, unknown>;
  type: 'text' | 'insights' | 'jobs' | 'tips' | 'greeting';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: AssistantResponse;
  timestamp: Date;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickInsights, setQuickInsights] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch quick insights on mount
  useEffect(() => {
    fetch('/api/ai/assistant')
      .then(res => res.json())
      .then(data => setQuickInsights(data.insights || []))
      .catch(() => {});
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const response: AssistantResponse = await res.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "Sorry, I couldn't process that. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    // Send greeting if no messages
    if (messages.length === 0) {
      sendMessage('hello');
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {/* Quick insight tooltip */}
        {quickInsights.length > 0 && (
          <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 p-3 max-w-xs animate-fade-in">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <LightbulbIcon className="w-3 h-3" />
              Quick Insight
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {quickInsights[0]}
            </p>
          </div>
        )}
        
        <button
          onClick={handleOpen}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
          aria-label="Open AI Assistant"
        >
          <SparklesIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all"
        >
          <SparklesIcon className="w-4 h-4" />
          <span className="text-sm font-medium">AI Assistant</span>
          <ChevronDownIcon className="w-4 h-4 rotate-180" />
        </button>
      </div>
    );
  }

  // Full chat window
  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col max-h-[600px] animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">AI Assistant</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Job search helper</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            aria-label="Minimize"
          >
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            aria-label="Close"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              
              {/* Resources (job boards) */}
              {msg.response?.resources && msg.response.resources.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.response.resources.map((resource, i) => (
                    <a
                      key={i}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                    >
                      <ExternalLinkIcon className="w-3 h-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{resource.name}</div>
                        <div className="text-xs opacity-75 truncate">{resource.specialty}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {msg.response?.suggestions && msg.response.suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {msg.response.suggestions.slice(0, 4).map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-2.5 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 transition-colors truncate max-w-full"
                    >
                      {suggestion.length > 40 ? suggestion.slice(0, 40) + '...' : suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
              <SpinnerIcon className="w-4 h-4 animate-spin text-zinc-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask me anything about jobs..."
            className="flex-1 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border-0 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * AIQuickTip - Subtle inline tip that appears on pages.
 */
export function AIQuickTip({ context }: { context: string }) {
  const [tip, setTip] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Get a contextual tip based on the page
    const tips: Record<string, string[]> = {
      applications: [
        "💡 Try to apply to 5-10 jobs daily for best results",
        "💡 Applications with follow-ups have 30% higher response rates",
        "💡 Tailor your resume for each application to stand out",
      ],
      dashboard: [
        "💡 Track your progress weekly to stay motivated",
        "💡 Set calendar reminders for follow-ups",
        "💡 Review rejected applications for patterns to improve",
      ],
      detail: [
        "💡 Add notes after each interview while details are fresh",
        "💡 Keep track of everyone you meet for future networking",
        "💡 Set a task to follow up within 24 hours of interviews",
      ],
    };

    const contextTips = tips[context] || tips.applications;
    const randomTip = contextTips[Math.floor(Math.random() * contextTips.length)];
    
    // Delay showing the tip slightly
    const timer = setTimeout(() => setTip(randomTip), 2000);
    return () => clearTimeout(timer);
  }, [context]);

  if (!tip || dismissed) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40 max-w-xs animate-fade-in">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 p-3 pr-8 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <CloseIcon className="w-3 h-3" />
        </button>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{tip}</p>
      </div>
    </div>
  );
}

export default AIAssistant;
