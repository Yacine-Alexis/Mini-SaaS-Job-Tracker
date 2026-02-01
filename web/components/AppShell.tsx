"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import UserPlanBadge from "@/components/UserPlanBadge";
import DarkModeToggle from "@/components/DarkModeToggle";
import Avatar from "@/components/ui/Avatar";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/applications", label: "Applications", icon: ApplicationsIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/documents", label: "Documents", icon: DocumentIcon },
  { href: "/tags", label: "Tags", icon: TagIcon },
  { href: "/analytics", label: "Analytics", icon: ChartIcon },
];

const comingSoonItems = [
  { label: "Interview Prep", icon: MicIcon, badge: "Soon" },
  { label: "Salary Insights", icon: ChartIcon, badge: "Pro" },
  { label: "Email Templates", icon: LetterIcon, badge: "Soon" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userEmail = session?.user?.email;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-zinc-900 dark:text-white text-lg">JobTracker</span>
                  <span className="ml-1.5 text-xs font-medium px-1.5 py-0.5 rounded-md bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400">Pro</span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}

                {/* Services Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setServicesOpen(!servicesOpen)}
                    onBlur={() => setTimeout(() => setServicesOpen(false), 150)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                  >
                    <GridIcon className="h-4 w-4" />
                    Services
                    <svg className={`h-4 w-4 transition-transform ${servicesOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {servicesOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3 py-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Coming Soon
                      </div>
                      {comingSoonItems.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-500 dark:text-zinc-400 cursor-not-allowed opacity-60"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1 text-sm">{item.label}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                            item.badge === "Pro"
                              ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                          }`}>
                            {item.badge}
                          </span>
                        </div>
                      ))}
                      <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700">
                        <div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500">
                          More tools coming in 2026 🚀
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              <UserPlanBadge />

              {/* Quick Add Button */}
              <Link
                href="/applications/new"
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden lg:inline">New</span>
              </Link>

              <div className="hidden sm:block h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />

              <DarkModeToggle />

              {/* User Avatar Dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Avatar email={userEmail} size="sm" />
                  <svg className={`h-4 w-4 text-zinc-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-700">
                      <div className="flex items-center gap-3">
                        <Avatar email={userEmail} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                            {userEmail || "User"}
                          </p>
                          <UserPlanBadge inline />
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        href="/settings/account"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <SettingsIcon className="h-4 w-4 text-zinc-400" />
                        Settings
                      </Link>
                      <Link
                        href="/settings/billing"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Billing
                      </Link>
                      <Link
                        href="/settings/audit"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Audit Log
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-700">
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
                      >
                        <LogoutIcon className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile: Settings + Logout icons */}
              <Link
                href="/settings/account"
                className="sm:hidden p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Settings"
              >
                <SettingsIcon className="h-5 w-5" />
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {mobileMenuOpen ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pb-4">
            <nav className="px-4 pt-4 space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/settings/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400"
              >
                <SettingsIcon className="h-5 w-5" />
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
              >
                <LogoutIcon className="h-5 w-5" />
                Sign out
              </button>
              <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-700">
                <div className="px-3 py-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Coming Soon
                </div>
                {comingSoonItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span>© 2026 JobTracker. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icon Components
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function ApplicationsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ImportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function LetterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
