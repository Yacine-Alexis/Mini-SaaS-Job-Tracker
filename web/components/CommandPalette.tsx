"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcut, KeyboardShortcutHint } from "@/lib/useKeyboardShortcuts";
import {
  PlusIcon,
  HomeIcon,
  BriefcaseIcon,
  UploadIcon,
  SettingsIcon,
  BillingIcon,
  MoonIcon,
  SunIcon,
  SearchIcon,
  LogoutIcon,
} from "@/components/icons";
import {
  SparklesIcon,
  SpinnerIcon,
  ExternalLinkIcon,
} from "@/components/icons";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category?: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  additionalCommands?: CommandItem[];
}

interface AIResponse {
  message: string;
  suggestions?: string[];
  resources?: { name: string; url: string; specialty: string }[];
  type: string;
}

// Detect if query is an AI question
function isAIQuery(q: string): boolean {
  const trimmed = q.trim();
  if (trimmed.startsWith("?") || trimmed.startsWith("ask ")) return true;
  if (/^(where|how|what|why|should|can|help|find|suggest|recommend)/i.test(trimmed)) return true;
  return false;
}

export default function CommandPalette({ additionalCommands = [] }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, []);

  // AI query handler
  const askAI = useCallback(async (question: string) => {
    setAiMode(true);
    setAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question.replace(/^\?|^ask /i, "").trim() }),
      });
      const data: AIResponse = await res.json();
      setAiResponse(data);
    } catch {
      setAiResponse({ message: "Sorry, I couldn't process that. Try again.", type: "error" });
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Built-in commands
  const builtInCommands: CommandItem[] = useMemo(() => [
    {
      id: "new-application",
      label: "New Application",
      description: "Create a new job application",
      icon: <PlusIcon className="h-4 w-4" />,
      shortcut: "N",
      action: () => router.push("/applications/new"),
      category: "Actions",
      keywords: ["create", "add", "job"],
    },
    {
      id: "go-dashboard",
      label: "Go to Dashboard",
      description: "View your dashboard",
      icon: <HomeIcon className="h-4 w-4" />,
      shortcut: "G D",
      action: () => router.push("/dashboard"),
      category: "Navigation",
      keywords: ["home", "overview", "stats"],
    },
    {
      id: "go-applications",
      label: "Go to Applications",
      description: "View all applications",
      icon: <BriefcaseIcon className="h-4 w-4" />,
      shortcut: "G A",
      action: () => router.push("/applications"),
      category: "Navigation",
      keywords: ["jobs", "list", "all"],
    },
    {
      id: "go-import",
      label: "Import Applications",
      description: "Import from CSV file",
      icon: <UploadIcon className="h-4 w-4" />,
      action: () => router.push("/applications/import"),
      category: "Actions",
      keywords: ["csv", "upload", "bulk"],
    },
    {
      id: "go-settings",
      label: "Go to Settings",
      description: "Account settings",
      icon: <SettingsIcon className="h-4 w-4" />,
      shortcut: "G S",
      action: () => router.push("/settings/account"),
      category: "Navigation",
      keywords: ["account", "profile", "preferences"],
    },
    {
      id: "go-billing",
      label: "Go to Billing",
      description: "Manage subscription",
      icon: <BillingIcon className="h-4 w-4" />,
      action: () => router.push("/settings/billing"),
      category: "Navigation",
      keywords: ["subscription", "plan", "upgrade", "pro"],
    },
    {
      id: "toggle-dark-mode",
      label: "Toggle Dark Mode",
      description: "Switch between light and dark theme",
      icon: <MoonIcon className="h-4 w-4" />,
      action: toggleDarkMode,
      category: "Preferences",
      keywords: ["theme", "light", "dark", "appearance"],
    },
    {
      id: "ask-ai",
      label: "Ask AI Assistant",
      description: "Ask questions about your job search",
      icon: <SparklesIcon className="h-4 w-4" />,
      shortcut: "?",
      action: () => {
        setQuery("? ");
        setAiMode(true);
      },
      category: "AI",
      keywords: ["help", "question", "assistant", "insights", "jobs", "where to apply"],
    },
  ], [router, toggleDarkMode]);

  const allCommands = useMemo(() => [...builtInCommands, ...additionalCommands], [builtInCommands, additionalCommands]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    
    const lowerQuery = query.toLowerCase();
    return allCommands.filter((cmd) => {
      const searchText = [
        cmd.label,
        cmd.description,
        ...(cmd.keywords || []),
      ].join(" ").toLowerCase();
      return searchText.includes(lowerQuery);
    });
  }, [allCommands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const cmd of filteredCommands) {
      const category = cmd.category || "Other";
      if (!groups[category]) groups[category] = [];
      groups[category].push(cmd);
    }
    return groups;
  }, [filteredCommands]);

  // Flatten for keyboard navigation
  const flatCommands = useMemo(() => filteredCommands, [filteredCommands]);

  // Open/close handlers
  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
    setAiMode(false);
    setAiResponse(null);
    setAiLoading(false);
  }, []);

  // Execute selected command
  const executeCommand = useCallback((cmd: CommandItem) => {
    closePalette();
    cmd.action();
  }, [closePalette]);

  // Keyboard shortcut to open
  useKeyboardShortcut({
    key: "k",
    ctrl: true,
    handler: openPalette,
    description: "Open command palette",
  });

  // Handle escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        closePalette();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, closePalette]);

  // Handle arrow keys and enter
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!aiMode) {
          setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1));
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!aiMode) {
          setSelectedIndex((i) => Math.max(i - 1, 0));
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        // Check if this is an AI query
        if (isAIQuery(query) && query.length > 2) {
          askAI(query);
        } else if (flatCommands[selectedIndex]) {
          executeCommand(flatCommands[selectedIndex]);
        }
      } else if (e.key === "Backspace" && aiMode && query.length <= 2) {
        // Exit AI mode when backspacing
        setAiMode(false);
        setAiResponse(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex, flatCommands, executeCommand, aiMode, query, askAI]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
    // Auto-detect AI mode
    if (isAIQuery(query)) {
      setAiMode(true);
    } else if (!query.startsWith("?")) {
      setAiMode(false);
      setAiResponse(null);
    }
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector("[data-selected='true']");
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={closePalette}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-start justify-center pt-[15vh] px-4">
        <div
          className="relative w-full max-w-xl bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-zinc-200 dark:border-zinc-700">
            {aiMode ? (
              <SparklesIcon className="h-5 w-5 text-purple-500" />
            ) : (
              <SearchIcon className="h-5 w-5 text-zinc-400" />
            )}
            <input
              ref={inputRef}
              type="text"
              className="flex-1 py-4 bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
              placeholder={aiMode ? "Ask me anything about your job search..." : "Type a command or search... (? to ask AI)"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <KeyboardShortcutHint keys="Esc" />
          </div>

          {/* AI Response Area */}
          {aiMode && (aiLoading || aiResponse) && (
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
              {aiLoading ? (
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              ) : aiResponse && (
                <div className="space-y-3">
                  <p className="text-zinc-800 dark:text-zinc-200 text-sm whitespace-pre-wrap">
                    {aiResponse.message}
                  </p>
                  
                  {/* Resources (job boards) */}
                  {aiResponse.resources && aiResponse.resources.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {aiResponse.resources.slice(0, 6).map((resource, i) => (
                        <a
                          key={i}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 transition-colors text-sm group"
                        >
                          <ExternalLinkIcon className="w-3 h-3 text-zinc-400 group-hover:text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-zinc-900 dark:text-white truncate">{resource.name}</div>
                            <div className="text-xs text-zinc-500 truncate">{resource.specialty}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {aiResponse.suggestions.slice(0, 4).map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setQuery(`? ${suggestion}`);
                            askAI(suggestion);
                          }}
                          className="px-2.5 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          {suggestion.length > 35 ? suggestion.slice(0, 35) + "..." : suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Command List */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
            {flatCommands.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                No commands found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    {category}
                  </div>
                  {commands.map((cmd) => {
                    const index = flatCommands.indexOf(cmd);
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        data-selected={isSelected}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isSelected
                            ? "bg-blue-500 text-white"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        }`}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <span className={isSelected ? "text-white" : "text-zinc-400 dark:text-zinc-500"}>
                          {cmd.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{cmd.label}</div>
                          {cmd.description && (
                            <div className={`text-xs truncate ${isSelected ? "text-blue-100" : "text-zinc-500 dark:text-zinc-400"}`}>
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <KeyboardShortcutHint 
                            keys={cmd.shortcut} 
                            className={isSelected ? "opacity-70" : ""}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-4">
              {aiMode ? (
                <span className="flex items-center gap-1">
                  <KeyboardShortcutHint keys="Enter" /> to ask
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-1">
                    <KeyboardShortcutHint keys="↑" /> <KeyboardShortcutHint keys="↓" /> to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <KeyboardShortcutHint keys="Enter" /> to select
                  </span>
                </>
              )}
            </div>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <KeyboardShortcutHint keys="?" /> AI mode
              </span>
              <span className="flex items-center gap-1">
                <KeyboardShortcutHint keys="Ctrl + K" /> to open
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
