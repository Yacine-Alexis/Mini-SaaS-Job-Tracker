import Link from "next/link";
import AuthButton from "@/components/AuthButton";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold">
              Job Tracker
            </Link>
            <nav className="text-sm text-zinc-600 flex gap-3">
              <Link href="/dashboard" className="hover:text-zinc-900">Dashboard</Link>
              <Link href="/applications" className="hover:text-zinc-900">Applications</Link>
            </nav>
          </div>
          <AuthButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
