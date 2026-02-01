"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import CommandPalette from "@/components/CommandPalette";
import { ScreenReaderAnnouncer } from "@/lib/accessibility";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <ScreenReaderAnnouncer />
        {children}
        <CommandPalette />
      </ToastProvider>
    </SessionProvider>
  );
}
