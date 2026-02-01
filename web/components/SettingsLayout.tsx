"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const settingsNav = [
  {
    label: "Account",
    href: "/settings/account",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    description: "Manage your account settings and password",
  },
  {
    label: "Billing",
    href: "/settings/billing",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    description: "Manage your subscription and billing",
  },
  {
    label: "Audit Log",
    href: "/settings/audit",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    description: "View your account activity history",
  },
];

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-start gap-3 rounded-xl px-4 py-3 transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <span className={`mt-0.5 ${isActive ? "text-blue-500" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"}`}>
                    {item.icon}
                  </span>
                  <div>
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className={`text-xs ${isActive ? "text-blue-500/70" : "text-zinc-400 dark:text-zinc-500"}`}>
                      {item.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Back to app link */}
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <Link
              href="/applications"
              className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to applications
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

// Card component for settings sections
interface SettingsCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  danger?: boolean;
}

export function SettingsCard({ title, description, children, footer, danger = false }: SettingsCardProps) {
  return (
    <div className={`rounded-xl border ${danger ? "border-red-200 dark:border-red-900/50" : "border-zinc-200 dark:border-zinc-700"} bg-white dark:bg-zinc-800 overflow-hidden`}>
      <div className="p-6">
        <h2 className={`text-lg font-semibold ${danger ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-white"}`}>
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        )}
        <div className="mt-4">{children}</div>
      </div>
      {footer && (
        <div className={`px-6 py-4 border-t ${danger ? "border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10" : "border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"}`}>
          {footer}
        </div>
      )}
    </div>
  );
}
