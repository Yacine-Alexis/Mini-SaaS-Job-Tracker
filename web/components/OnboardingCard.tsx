"use client";

import { useState } from "react";
import Link from "next/link";

export default function OnboardingCard({ onSeeded }: { onSeeded?: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function seed() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/onboarding/sample-data", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to add sample data");
        return;
      }
      if (onSeeded) await onSeeded();
      else window.location.reload();
    } catch {
      setErr("Failed to add sample data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 space-y-2">
      <div className="text-lg font-semibold">Welcome 👋</div>
      <p className="text-sm text-zinc-600">
        Get started by creating your first application, importing from CSV, or adding sample data.
      </p>

      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="flex flex-wrap gap-2 pt-2">
        <Link className="btn btn-primary" href="/applications/new">Create application</Link>
        <Link className="btn" href="/applications/import">Import CSV</Link>
        <button className="btn" onClick={seed} disabled={loading}>
          {loading ? "Adding…" : "Add sample data"}
        </button>
      </div>
    </div>
  );
}
