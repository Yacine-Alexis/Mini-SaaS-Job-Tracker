/**
 * Date formatting utilities for consistent display across the app.
 * Uses Intl.DateTimeFormat for locale-aware formatting.
 */

/**
 * Format a date for display in a human-readable format.
 * Handles timezone properly by using the browser's locale.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(d);
  } catch {
    return "—";
  }
}

/**
 * Format a date and time for display.
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  } catch {
    return "—";
  }
}

/**
 * Format a date as relative time (e.g., "2 days ago").
 */
export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "—";
  
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // Fallback to formatted date for older dates
    return formatDate(d);
  } catch {
    return "—";
  }
}

/**
 * Format a date for input[type="date"] value (YYYY-MM-DD).
 */
export function toDateInputValue(date: string | Date | null | undefined): string {
  if (!date) return "";
  
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}
