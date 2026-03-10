/**
 * Utility functions for the application.
 * @module lib/utils
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge.
 * Useful for conditionally joining classNames together.
 * 
 * @param inputs - Class values to merge
 * @returns Merged class string
 * 
 * @example
 * ```tsx
 * <div className={cn("base-class", isActive && "active-class", {
 *   "conditional-class": someCondition
 * })} />
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
