"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function ResetPasswordForm() {
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!token) { setErr("Missing token."); return; }
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (pw !== pw2) { setErr("Passwords do not match."); return; }

    setStatus("loading");
    setErr(null);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, newPassword: pw })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(data?.error?.message ?? "Reset failed");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setErr("Reset failed");
      setStatus("idle");
    }
  }

  return (
    <div className="card p-6">
      <h1 className="text-xl font-semibold">Reset password</h1>

      <label className="block mt-4 text-sm font-medium">New password</label>
      <input className="input mt-1 w-full" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />

      <label className="block mt-3 text-sm font-medium">Confirm password</label>
      <input className="input mt-1 w-full" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

      <button className="btn btn-primary mt-4 w-full" onClick={submit} disabled={status === "loading"}>
        {status === "loading" ? "Resetting…" : "Reset password"}
      </button>

      {status === "done" && (
        <div className="mt-3 text-sm text-zinc-700">
          Password updated. <Link className="underline" href="/login">Sign in</Link>.
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <Suspense fallback={<div className="card p-6 animate-pulse">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
