"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import AuthLayout from "@/components/AuthLayout";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setRemainingAttempts(null);
    setLoading(true);

    try {
      // Validate credentials (and 2FA if required)
      const validateRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password,
          ...(requires2FA && twoFactorCode ? { twoFactorCode } : {}),
        }),
      });

      const validateData = await validateRes.json();

      // Check if 2FA is required
      if (validateData.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      if (!validateRes.ok) {
        // Handle throttling/lockout errors
        if (validateData.details?.remainingAttempts !== undefined) {
          setRemainingAttempts(validateData.details.remainingAttempts);
        }
        setErr(validateData.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Credentials validated - proceed with NextAuth signIn
      const res = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/applications",
        redirect: true
      });

      if (res?.error) setErr(res.error);
    } catch {
      setErr("An error occurred. Please try again.");
    }
    
    setLoading(false);
  }

  return (
    <AuthLayout
      title={requires2FA ? "Two-Factor Authentication" : "Welcome back"}
      subtitle={requires2FA 
        ? "Enter the code from your authenticator app" 
        : "Sign in to your account to continue tracking your job search"
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {!requires2FA ? (
          <>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input pl-10"
                  placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
          </>
        ) : (
          /* 2FA Code Input */
          <div>
            <label htmlFor="twoFactorCode" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Authentication Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9A-Za-z\-]*"
                autoComplete="one-time-code"
                required
                className="input pl-10 text-center tracking-widest text-lg"
                placeholder="000000"
                maxLength={9}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\s/g, ""))}
                autoFocus
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Enter the 6-digit code from your authenticator app, or a backup code
            </p>
            <button
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setTwoFactorCode("");
                setErr(null);
              }}
              className="mt-3 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              ← Back to login
            </button>
          </div>
        )}

        {/* Error message */}
        {err && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-red-700 dark:text-red-300">{err}</p>
              {remainingAttempts !== null && remainingAttempts <= 2 && remainingAttempts > 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Warning: {remainingAttempts} attempt{remainingAttempts === 1 ? "" : "s"} remaining before lockout
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {requires2FA ? "Verifying..." : "Signing in..."}
            </>
          ) : (
            requires2FA ? "Verify" : "Sign in"
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-zinc-900 text-zinc-500">New to JobTracker?</span>
          </div>
        </div>

        {/* Register link */}
        <Link
          href="/register"
          className="w-full flex items-center justify-center rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-all"
        >
          Create an account
        </Link>
      </form>
    </AuthLayout>
  );
}
