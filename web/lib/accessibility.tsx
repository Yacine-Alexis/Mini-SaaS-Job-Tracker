"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Hook to announce messages to screen readers
 */
export function useAnnounce() {
  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const announcer = document.getElementById(`sr-announcer-${priority}`);
    if (announcer) {
      announcer.textContent = "";
      // Small delay to ensure the change is picked up
      setTimeout(() => {
        announcer.textContent = message;
      }, 50);
    }
  }, []);

  return announce;
}

/**
 * Component that provides screen reader announcement regions
 */
export function ScreenReaderAnnouncer() {
  return (
    <>
      <div
        id="sr-announcer-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        id="sr-announcer-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}

/**
 * Hook for focus management
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element on mount
    firstElement?.focus();

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to restore focus when component unmounts
 */
export function useFocusReturn() {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement;

    return () => {
      previousActiveElement.current?.focus();
    };
  }, []);
}

/**
 * Skip link component for keyboard navigation
 * Only visible when focused (for keyboard users)
 */
export function SkipLink({ href = "#main-content", children = "Skip to main content" }: { href?: string; children?: React.ReactNode }) {
  return (
    <a
      href={href}
      className="
        absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0
        [clip:rect(0,0,0,0)]
        focus:static focus:w-auto focus:h-auto focus:p-0 focus:m-0 focus:overflow-visible
        focus:whitespace-normal focus:[clip:auto]
        focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 
        focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none 
        focus:ring-2 focus:ring-white focus:ring-offset-2
      "
    >
      {children}
    </a>
  );
}

/**
 * Visually hidden component for screen reader only content
 */
export function VisuallyHidden({ children, as: Component = "span" }: { children: React.ReactNode; as?: keyof JSX.IntrinsicElements }) {
  return <Component className="sr-only">{children}</Component>;
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}

/**
 * Hook for high contrast preference
 */
export function useHighContrast(): boolean {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: more)");
    setHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return highContrast;
}

/**
 * Accessible icon button
 */
interface AccessibleIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
}

export function AccessibleIconButton({ label, icon, className = "", ...props }: AccessibleIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center ${className}`}
      {...props}
    >
      {icon}
      <VisuallyHidden>{label}</VisuallyHidden>
    </button>
  );
}

/**
 * Loading state with accessible announcement
 */
interface LoadingStateProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingState({ isLoading, loadingText = "Loading...", children }: LoadingStateProps) {
  const announce = useAnnounce();

  useEffect(() => {
    if (isLoading) {
      announce(loadingText);
    }
  }, [isLoading, loadingText, announce]);

  return (
    <div aria-busy={isLoading} aria-live="polite">
      {children}
    </div>
  );
}

/**
 * Progress indicator with ARIA
 */
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, label, showValue = false, className = "" }: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
          {showValue && <span className="text-zinc-500 dark:text-zinc-400">{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
