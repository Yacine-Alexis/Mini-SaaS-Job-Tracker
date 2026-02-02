import Link from "next/link";

export function Footer() {
  return (
    <footer className="hidden md:block border-t border-zinc-200 dark:border-zinc-800 mt-auto">
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
  );
}
