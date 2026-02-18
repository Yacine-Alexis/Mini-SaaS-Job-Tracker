"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export default function KeyboardShortcuts() {
  const router = useRouter();
  const { data: session } = useSession();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Shortcut[] = [
    {
      key: "n",
      ctrl: true,
      description: "New application",
      action: () => router.push("/applications/new"),
    },
    {
      key: "d",
      ctrl: true,
      shift: true,
      description: "Go to Dashboard",
      action: () => router.push("/dashboard"),
    },
    {
      key: "a",
      ctrl: true,
      shift: true,
      description: "Go to Applications",
      action: () => router.push("/applications"),
    },
    {
      key: "i",
      ctrl: true,
      shift: true,
      description: "Go to Import",
      action: () => router.push("/applications/import"),
    },
    {
      key: "s",
      ctrl: true,
      shift: true,
      description: "Go to Settings",
      action: () => router.push("/settings/account"),
    },
    {
      key: "/",
      description: "Show keyboard shortcuts",
      action: () => setShowHelp(true),
    },
    {
      key: "Escape",
      description: "Close modal",
      action: () => setShowHelp(false),
    },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        // Allow Escape to close modals even in inputs
        if (e.key !== "Escape") return;
      }

      // Must be logged in for navigation shortcuts
      if (!session && e.key !== "/" && e.key !== "Escape") return;

      for (const shortcut of shortcuts) {
        const ctrlMatch =
          shortcut.ctrl === undefined
            ? !e.ctrlKey && !e.metaKey
            : shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const shiftMatch =
          shortcut.shift === undefined ? !e.shiftKey : shortcut.shift === e.shiftKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [session, shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowHelp(false)}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setShowHelp(false)}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-3 max-h-96 overflow-y-auto">
          {shortcuts
            .filter((s) => s.key !== "Escape")
            .map((shortcut) => (
              <div
                key={shortcut.key + (shortcut.ctrl ? "-ctrl" : "") + (shortcut.shift ? "-shift" : "")}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {shortcut.description}
                </span>
                <kbd className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600">
                  {shortcut.ctrl && (
                    <>
                      <span className="text-zinc-500">⌘/Ctrl</span>
                      <span className="text-zinc-400">+</span>
                    </>
                  )}
                  {shortcut.shift && (
                    <>
                      <span className="text-zinc-500">Shift</span>
                      <span className="text-zinc-400">+</span>
                    </>
                  )}
                  <span>{shortcut.key.toUpperCase()}</span>
                </kbd>
              </div>
            ))}
        </div>

        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Press <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
