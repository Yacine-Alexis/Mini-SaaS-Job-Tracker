"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-gray-50 dark:bg-gray-900">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="space-y-4">
              <div className="text-6xl">💥</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                We apologize for the inconvenience. Our team has been notified and is working on a fix.
              </p>
              {error.digest && (
                <p className="text-sm text-gray-500 dark:text-gray-500 font-mono">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => reset()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Go to homepage
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
