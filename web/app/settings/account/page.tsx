"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import SettingsLayout, { SettingsCard } from "@/components/SettingsLayout";
import Avatar from "@/components/ui/Avatar";
import { ConfirmModal } from "@/components/ui/Modal";

export default function AccountSettingsPage() {
  const { data: session } = useSession();
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [nw2, setNw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    setMsg("Password updated successfully.");
  }

  async function deleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "POST" });
    const data = await res.json().catch(() => null);
    
    if (!res.ok) {
      setDeleting(false);
      setDeleteModalOpen(false);
      setErr(data?.error?.message ?? "Delete failed");
      return;
    }

    window.location.href = "/register";
  }

  const userEmail = session?.user?.email;

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Profile Section */}
        <SettingsCard 
          title="Profile" 
          description="Your account information"
        >
          <div className="flex items-center gap-4">
            <Avatar email={userEmail} size="xl" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {userEmail || "User"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Member since {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </SettingsCard>

        {/* Change Password Section */}
        <SettingsCard 
          title="Change Password" 
          description="Update your password to keep your account secure"
        >
          {msg && (
            <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-700 dark:text-green-300">{msg}</span>
            </div>
          )}
          {err && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-300">{err}</span>
            </div>
          )}

          <div className="space-y-4 max-w-md">
            <div>
              <label htmlFor="current" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Current password
              </label>
              <input 
                id="current"
                className="input" 
                type="password" 
                placeholder="Enter current password" 
                value={cur} 
                onChange={(e) => setCur(e.target.value)} 
              />
            </div>
            <div>
              <label htmlFor="new" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                New password
              </label>
              <input 
                id="new"
                className="input" 
                type="password" 
                placeholder="Enter new password" 
                value={nw} 
                onChange={(e) => setNw(e.target.value)} 
              />
              <p className="mt-1 text-xs text-zinc-500">Minimum 8 characters</p>
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Confirm new password
              </label>
              <input 
                id="confirm"
                className="input" 
                type="password" 
                placeholder="Confirm new password" 
                value={nw2} 
                onChange={(e) => setNw2(e.target.value)} 
              />
            </div>
            <button 
              className="rounded-xl bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              onClick={changePassword}
            >
              Update password
            </button>
          </div>
        </SettingsCard>

        {/* Danger Zone */}
        <SettingsCard 
          title="Danger Zone" 
          description="Irreversible and destructive actions"
          danger
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Once you delete your account, there is no going back. All your data will be permanently removed.
          </p>
          <button 
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete account
          </button>
        </SettingsCard>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={deleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone. All your applications, notes, tasks, and other data will be permanently deleted."
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </SettingsLayout>
  );
}
