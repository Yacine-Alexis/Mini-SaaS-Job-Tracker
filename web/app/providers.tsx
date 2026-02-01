"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import CommandPalette from "@/components/CommandPalette";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <CommandPalette />
      </ToastProvider>
    </SessionProvider>
  );
}
