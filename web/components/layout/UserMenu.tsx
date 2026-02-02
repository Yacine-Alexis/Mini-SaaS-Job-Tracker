"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDownIcon, SettingsIcon, LogoutIcon } from "@/components/icons";
import UserPlanBadge from "@/components/UserPlanBadge";
import Avatar from "@/components/ui/Avatar";

interface UserMenuProps {
  userEmail?: string | null;
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <Avatar email={userEmail} size="sm" />
        <ChevronDownIcon className={`h-4 w-4 text-zinc-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
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
  );
}
