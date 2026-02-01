"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Registration failed");
        return;
      }

      // Auto sign-in
      const signInRes = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/applications"
      });

      if (signInRes?.error) setErr(signInRes.error);
    } catch {
      setErr("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md card p-6">
      <h1 className="text-xl font-semibold">Create account</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Already have one? <Link className="underline" href="/login">Sign in</Link>
      </p>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <div>
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
