"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";

// OAuth error codes and their user-friendly messages
const errorMessages: Record<string, { title: string; message: string }> = {
  Configuration: {
    title: "Configuration Error",
    message: "There is a problem with the server configuration. Please contact support.",
  },
  AccessDenied: {
    title: "Access Denied",
    message: "You do not have permission to sign in. Please try a different account.",
  },
  Verification: {
    title: "Verification Failed",
    message: "The verification link may have expired or already been used. Please try signing in again.",
  },
  OAuthSignin: {
    title: "OAuth Sign In Error",
    message: "Could not start the OAuth sign in process. Please try again.",
  },
  OAuthCallback: {
    title: "OAuth Callback Error",
    message: "Could not complete the OAuth sign in. Please try again.",
  },
  OAuthCreateAccount: {
    title: "Account Creation Failed",
    message: "Could not create your account using OAuth. Please try a different sign in method.",
  },
  EmailCreateAccount: {
    title: "Account Creation Failed",
    message: "Could not create your account. This email may already be registered.",
  },
  Callback: {
    title: "Callback Error",
    message: "There was an error during the authentication process. Please try again.",
  },
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    message: "This email is already registered with a different sign in method. Please use your original sign in method.",
  },
  EmailSignin: {
    title: "Email Sign In Error",
    message: "Could not send the sign in email. Please try again.",
  },
  CredentialsSignin: {
    title: "Sign In Failed",
    message: "Invalid email or password. Please check your credentials and try again.",
  },
  SessionRequired: {
    title: "Session Required",
    message: "You need to be signed in to access this page.",
  },
  Default: {
    title: "Authentication Error",
    message: "An unexpected error occurred during authentication. Please try again.",
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") || "Default";
  
  const errorInfo = errorMessages[errorCode] || errorMessages.Default;

  return (
    <AuthLayout
      title={errorInfo.title}
      subtitle="Something went wrong with your sign in"
    >
      <div className="text-center space-y-6">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <p className="text-zinc-600 dark:text-zinc-400">
            {errorInfo.message}
          </p>
          {errorCode !== "Default" && (
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Error code: {errorCode}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/login"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            Try Again
          </Link>
          <Link
            href="/register"
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            Create Account
          </Link>
        </div>

        {/* Help Text */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            If you continue to experience issues, please{" "}
            <a
              href="mailto:support@jobtracker.app"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

function LoadingFallback() {
  return (
    <AuthLayout
      title="Loading..."
      subtitle="Please wait"
    >
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    </AuthLayout>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}
