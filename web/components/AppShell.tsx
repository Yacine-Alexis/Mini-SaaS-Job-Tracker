"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import UserPlanBadge from "@/components/UserPlanBadge";
import DarkModeToggle from "@/components/DarkModeToggle";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ServicesDropdown, UserMenu, Footer } from "@/components/layout";
import {
  DashboardIcon,
  ApplicationsIcon,
  CalendarIcon,
  DocumentIcon,
  TagIcon,
  ChartIcon,
  MicIcon,
  LetterIcon,
  SettingsIcon,
  LogoutIcon,
  PlusIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/icons";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ComingSoonItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/applications", label: "Applications", icon: ApplicationsIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/documents", label: "Documents", icon: DocumentIcon },
  { href: "/tags", label: "Tags", icon: TagIcon },
  { href: "/analytics", label: "Analytics", icon: ChartIcon },
];

const comingSoonItems: ComingSoonItem[] = [
  { label: "Interview Prep", icon: MicIcon, badge: "Soon" },
  { label: "Salary Insights", icon: ChartIcon, badge: "Pro" },
  { label: "Email Templates", icon: LetterIcon, badge: "Soon" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userEmail = session?.user?.email;

  const isActive = (href: string) => 
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

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
                {mainNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}

                {/* Services Dropdown */}
                <ServicesDropdown />
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
                <PlusIcon className="h-4 w-4" />
                <span className="hidden lg:inline">New</span>
              </Link>

              <div className="hidden sm:block h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />

              <DarkModeToggle />

              {/* User Avatar Dropdown */}
              <UserMenu userEmail={userEmail} />

              {/* Mobile: Settings icon */}
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
                  <CloseIcon className="h-5 w-5" />
                ) : (
                  <MenuIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pb-4">
            <nav className="px-4 pt-4 space-y-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
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
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6">{children}</main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Footer */}
      <Footer />
    </div>
  );
}
