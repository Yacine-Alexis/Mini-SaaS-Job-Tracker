"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import { SWRProvider } from "@/components/providers/SWRProvider";
import CommandPalette from "@/components/CommandPalette";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { ScreenReaderAnnouncer } from "@/lib/accessibility";
import { initWebVitals } from "@/lib/webVitals";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Initialize Web Vitals monitoring
  useEffect(() => {
    initWebVitals({
      analytics: true,
      sentry: true,
    });
  }, []);

  return (
    <SessionProvider>
      <SWRProvider>
        <ToastProvider>
          <ScreenReaderAnnouncer />
          {children}
          <CommandPalette />
          <KeyboardShortcuts />
        </ToastProvider>
      </SWRProvider>
    </SessionProvider>
  );
}
