"use client";

import { useState } from "react";

export default function AccountSettingsPage() {
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [nw2, setNw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function changePassword() {
    setMsg(null); setErr(null);
    if (nw.length < 8) return setErr("New password must be at least 8 characters.");
    if (nw !== nw2) return setErr("Passwords do not match.");

    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword: cur, newPassword: nw })
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) return setErr(data?.error?.message ?? "Failed to change password");

    setCur(""); setNw(""); setNw2("");
    setMsg("Password updated.");
  }

  async function deleteAccount() {
    setMsg(null); setErr(null);
    if (!confirm("This will permanently delete your account and data. Continue?")) return;

    const res = await fetch("/api/account/delete", { method: "POST" });
    const data = await res.json().catch(() => null);
    if (!res.ok) return setErr(data?.error?.message ?? "Delete failed");

    window.location.href = "/register";
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="card p-6 space-y-3">
        <h1 className="text-xl font-semibold">Account settings</h1>

        {msg && <div className="text-sm text-green-700">{msg}</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="space-y-2">
          <div className="font-medium">Change password</div>
          <input className="input w-full" type="password" placeholder="Current password" value={cur} onChange={(e) => setCur(e.target.value)} />
          <input className="input w-full" type="password" placeholder="New password" value={nw} onChange={(e) => setNw(e.target.value)} />
          <input className="input w-full" type="password" placeholder="Confirm new password" value={nw2} onChange={(e) => setNw2(e.target.value)} />
          <button className="btn btn-primary" onClick={changePassword}>Update password</button>
        </div>
      </div>

      <div className="card p-6 space-y-2">
        <div className="font-medium text-red-700">Danger zone</div>
        <p className="text-sm text-zinc-600">
          Delete your account and all associated data.
        </p>
        <button className="btn" onClick={deleteAccount}>Delete account</button>
      </div>
    </div>
  );
}
