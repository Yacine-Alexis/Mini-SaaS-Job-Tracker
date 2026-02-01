"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseAutoSaveOptions<T> {
  /** Data to auto-save */
  data: T;
  /** Function to save data (returns promise) */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in ms (default: 1500) */
  delay?: number;
  /** Storage key for drafts (optional, enables localStorage backup) */
  storageKey?: string;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  /** Current save status */
  status: "idle" | "saving" | "saved" | "error" | "draft";
  /** Last saved timestamp */
  lastSaved: Date | null;
  /** Error message if save failed */
  error: string | null;
  /** Manually trigger save */
  save: () => Promise<void>;
  /** Clear draft from storage */
  clearDraft: () => void;
  /** Whether there are unsaved changes */
  isDirty: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 1500,
  storageKey,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<UseAutoSaveReturn["status"]>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>(JSON.stringify(data));
  const isMountedRef = useRef(true);

  // Track if data changed
  useEffect(() => {
    const currentData = JSON.stringify(data);
    if (currentData !== lastDataRef.current) {
      setIsDirty(true);
      setStatus("draft");
      
      // Save to localStorage as draft
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, currentData);
        } catch {
          // Storage might be full
        }
      }
    }
  }, [data, storageKey]);

  // Auto-save with debounce
  useEffect(() => {
    if (!enabled || !isDirty) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      
      setStatus("saving");
      setError(null);

      try {
        await onSave(data);
        
        if (!isMountedRef.current) return;
        
        lastDataRef.current = JSON.stringify(data);
        setLastSaved(new Date());
        setStatus("saved");
        setIsDirty(false);
        
        // Clear draft on successful save
        if (storageKey) {
          try {
            localStorage.removeItem(storageKey);
          } catch {
            // Ignore
          }
        }

        // Reset to idle after a moment
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatus("idle");
          }
        }, 2000);
      } catch (err) {
        if (!isMountedRef.current) return;
        
        setStatus("error");
        setError(err instanceof Error ? err.message : "Save failed");
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay, enabled, isDirty, storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const save = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setStatus("saving");
    setError(null);

    try {
      await onSave(data);
      lastDataRef.current = JSON.stringify(data);
      setLastSaved(new Date());
      setStatus("saved");
      setIsDirty(false);
      
      if (storageKey) {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Save failed");
      throw err;
    }
  }, [data, onSave, storageKey]);

  const clearDraft = useCallback(() => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
    setIsDirty(false);
    setStatus("idle");
  }, [storageKey]);

  return {
    status,
    lastSaved,
    error,
    save,
    clearDraft,
    isDirty,
  };
}

// Load draft from storage
export function loadDraft<T>(storageKey: string): T | null {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch {
    // Invalid JSON or storage error
  }
  return null;
}

// Hook to restore draft on mount
export function useDraftRestore<T>(
  storageKey: string,
  onRestore: (draft: T) => void
): { hasDraft: boolean; restoreDraft: () => void; discardDraft: () => void } {
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const draft = loadDraft<T>(storageKey);
    setHasDraft(draft !== null);
  }, [storageKey]);

  const restoreDraft = useCallback(() => {
    const draft = loadDraft<T>(storageKey);
    if (draft) {
      onRestore(draft);
    }
  }, [storageKey, onRestore]);

  const discardDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setHasDraft(false);
  }, [storageKey]);

  return { hasDraft, restoreDraft, discardDraft };
}
