"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data, status } = useSession();

  if (status === "loading") return <div className="text-sm text-zinc-500">Loading…</div>;

  if (!data?.user) {
    return (
      <div className="flex gap-2">
        <Link className="btn" href="/login">Sign in</Link>
        <Link className="btn btn-primary" href="/register">Create account</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-600">{data.user.email}</span>
      <button className="btn" onClick={() => signOut({ callbackUrl: "/login" })}>
        Sign out
      </button>
    </div>
  );
}
