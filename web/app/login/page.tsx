"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/applications",
      redirect: true
    });

    if (res?.error) setErr(res.error);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md card p-6">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-zinc-600">
        No account? <Link className="underline" href="/register">Create one</Link>
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
