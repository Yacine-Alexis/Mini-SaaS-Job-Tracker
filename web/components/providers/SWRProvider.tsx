"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

interface SWRProviderProps {
  children: React.ReactNode;
}

/**
 * Global SWR Configuration Provider
 * 
 * Provides default configuration for all SWR hooks:
 * - Default fetcher with error handling
 * - Automatic revalidation settings
 * - Error retry configuration
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        shouldRetryOnError: (error) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return true;
        },
        onError: (error, key) => {
          // Log errors in development
          if (process.env.NODE_ENV === "development") {
            console.error(`SWR Error [${key}]:`, error);
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
