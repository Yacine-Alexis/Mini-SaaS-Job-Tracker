"use client";

import { useEffect, useCallback } from "react";

type KeyHandler = (e: KeyboardEvent) => void;

interface KeyBinding {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: KeyHandler;
  description?: string;
  preventDefault?: boolean;
}

// Global registry for keyboard shortcuts help display
export const shortcutRegistry: { key: string; description: string }[] = [];

function registerShortcut(key: string, description: string) {
  const existing = shortcutRegistry.find((s) => s.key === key);
  if (!existing) {
    shortcutRegistry.push({ key, description });
  }
}

function unregisterShortcut(key: string) {
  const index = shortcutRegistry.findIndex((s) => s.key === key);
  if (index !== -1) {
    shortcutRegistry.splice(index, 1);
  }
}

function formatKeyCombo(binding: KeyBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.meta) parts.push("⌘");
  if (binding.alt) parts.push("Alt");
  if (binding.shift) parts.push("Shift");
  parts.push(binding.key.toUpperCase());
  return parts.join(" + ");
}

export function useKeyboardShortcut(bindings: KeyBinding | KeyBinding[]) {
  const bindingsArray = Array.isArray(bindings) ? bindings : [bindings];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || 
                      target.tagName === "TEXTAREA" || 
                      target.isContentEditable;

      for (const binding of bindingsArray) {
        const keyMatch = e.key.toLowerCase() === binding.key.toLowerCase();
        const ctrlMatch = binding.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey;
        const metaMatch = binding.meta ? e.metaKey : true;
        const shiftMatch = binding.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = binding.alt ? e.altKey : !e.altKey;

        // Special handling: Ctrl/Cmd+K should work even in inputs (for command palette)
        const isGlobalShortcut = binding.ctrl && binding.key.toLowerCase() === "k";

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          if (isInput && !isGlobalShortcut) continue;
          
          if (binding.preventDefault !== false) {
            e.preventDefault();
          }
          binding.handler(e);
          break;
        }
      }
    },
    [bindingsArray]
  );

  useEffect(() => {
    // Register shortcuts for help display
    for (const binding of bindingsArray) {
      if (binding.description) {
        registerShortcut(formatKeyCombo(binding), binding.description);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      for (const binding of bindingsArray) {
        if (binding.description) {
          unregisterShortcut(formatKeyCombo(binding));
        }
      }
    };
  }, [handleKeyDown, bindingsArray]);
}

// Commonly used shortcuts
export function useEscapeKey(handler: () => void) {
  useKeyboardShortcut({
    key: "Escape",
    handler,
    preventDefault: false,
  });
}

// Hook for arrow key navigation
export function useArrowNavigation(
  onUp: () => void,
  onDown: () => void,
  onEnter?: () => void,
  enabled = true
) {
  useKeyboardShortcut([
    { key: "ArrowUp", handler: onUp, description: "Navigate up" },
    { key: "ArrowDown", handler: onDown, description: "Navigate down" },
    ...(onEnter ? [{ key: "Enter", handler: onEnter, description: "Select" }] : []),
  ].map((b) => ({ ...b, preventDefault: enabled })));
}

// Keyboard shortcut display component
export function KeyboardShortcutHint({ keys, className = "" }: { keys: string; className?: string }) {
  const keyParts = keys.split("+").map((k) => k.trim());
  
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {keyParts.map((key, i) => (
        <kbd
          key={i}
          className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded shadow-sm"
        >
          {key === "Ctrl" ? "⌃" : key === "Cmd" ? "⌘" : key === "Alt" ? "⌥" : key === "Shift" ? "⇧" : key}
        </kbd>
      ))}
    </span>
  );
}
