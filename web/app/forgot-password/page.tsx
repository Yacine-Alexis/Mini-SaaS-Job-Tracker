"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setStatus("loading");
    setErr(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(data?.error?.message ?? "Request failed");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setErr("Request failed");
      setStatus("idle");
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Forgot password</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Enter your email. If an account exists, we’ll send a reset link.
        </p>

        <label className="block mt-4 text-sm font-medium">Email</label>
        <input className="input mt-1 w-full" value={email} onChange={(e) => setEmail(e.target.value)} />

        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

        <button
          className="btn btn-primary mt-4 w-full"
          onClick={submit}
          disabled={status === "loading" || !email.trim()}
        >
          {status === "loading" ? "Sending…" : "Send reset link"}
        </button>

        {status === "done" && (
          <div className="mt-3 text-sm text-zinc-700">
            If that email exists, a reset link was sent. (In dev without SMTP, check server logs.)
          </div>
        )}

        <div className="mt-4 text-sm">
          <Link className="underline" href="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
