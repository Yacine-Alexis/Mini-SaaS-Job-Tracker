"use client";

import { useState } from "react";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";

interface LandingHeaderProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export default function LandingHeader({ onLoginClick, onSignupClick }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">JobTracker Pro</span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
              Pricing
            </a>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onLoginClick}
                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={onSignupClick}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all"
              >
                Get Started Free
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-600 dark:text-zinc-400"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col gap-3">
              <a href="#features" className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Features
              </a>
              <a href="#how-it-works" className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                How It Works
              </a>
              <a href="#pricing" className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Pricing
              </a>
              <div className="flex flex-col gap-2 px-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={onLoginClick}
                  className="w-full py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                >
                  Sign in
                </button>
                <button
                  onClick={onSignupClick}
                  className="w-full py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg"
                >
                  Get Started Free
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
