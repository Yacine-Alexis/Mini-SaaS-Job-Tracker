"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import SettingsLayout, { SettingsCard } from "@/components/SettingsLayout";
import Avatar from "@/components/ui/Avatar";
import { ConfirmModal } from "@/components/ui/Modal";

interface ConnectedAccount {
  provider: string;
  connectedAt: string;
}

export default function AccountSettingsPage() {
  const { data: session } = useSession();
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [nw2, setNw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Connected accounts state
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [hasPassword, setHasPassword] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Fetch connected accounts
  useEffect(() => {
    async function fetchConnections() {
      try {
        const res = await fetch("/api/account/connections");
        if (res.ok) {
          const data = await res.json();
          setConnectedAccounts(data.accounts || []);
          setHasPassword(data.hasPassword || false);
        }
      } catch {
        // Ignore errors
      } finally {
        setLoadingAccounts(false);
      }
    }
    fetchConnections();
  }, []);

  const isConnected = (provider: string) =>
    connectedAccounts.some((a) => a.provider === provider);

  async function disconnectProvider(provider: string) {
    setDisconnecting(provider);
    setErr(null);
    
    try {
      const res = await fetch(`/api/account/connections?provider=${provider}`, {
        method: "DELETE",
      });
      const data = await res.json();
      
      if (!res.ok) {
        setErr(data?.error?.message ?? `Failed to disconnect ${provider}`);
        return;
      }
      
      setConnectedAccounts((prev) => prev.filter((a) => a.provider !== provider));
      setMsg(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account disconnected`);
    } catch {
      setErr(`Failed to disconnect ${provider}`);
    } finally {
      setDisconnecting(null);
    }
  }

  async function connectProvider(provider: string) {
    // Redirect to OAuth flow - it will link to existing account
    await signIn(provider, { callbackUrl: "/settings/account" });
  }

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

        {/* Connected Accounts Section */}
        <SettingsCard 
          title="Connected Accounts" 
          description="Link your accounts for easier sign in"
        >
          {loadingAccounts ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-400"></div>
              Loading...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">Google</p>
                    <p className="text-xs text-zinc-500">
                      {isConnected("google") ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {isConnected("google") ? (
                  <button
                    onClick={() => disconnectProvider("google")}
                    disabled={disconnecting === "google" || (!hasPassword && connectedAccounts.length <= 1)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!hasPassword && connectedAccounts.length <= 1 ? "Set a password first to disconnect" : ""}
                  >
                    {disconnecting === "google" ? "Disconnecting..." : "Disconnect"}
                  </button>
                ) : (
                  <button
                    onClick={() => connectProvider("google")}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* GitHub */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6 text-zinc-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">GitHub</p>
                    <p className="text-xs text-zinc-500">
                      {isConnected("github") ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {isConnected("github") ? (
                  <button
                    onClick={() => disconnectProvider("github")}
                    disabled={disconnecting === "github" || (!hasPassword && connectedAccounts.length <= 1)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!hasPassword && connectedAccounts.length <= 1 ? "Set a password first to disconnect" : ""}
                  >
                    {disconnecting === "github" ? "Disconnecting..." : "Disconnect"}
                  </button>
                ) : (
                  <button
                    onClick={() => connectProvider("github")}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Connect
                  </button>
                )}
              </div>

              {!hasPassword && connectedAccounts.length <= 1 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  💡 Set a password below to be able to disconnect your social account
                </p>
              )}
            </div>
          )}
        </SettingsCard>

        {/* Change Password Section */}
        <SettingsCard 
          title={hasPassword ? "Change Password" : "Set Password"}
          description={hasPassword 
            ? "Update your password to keep your account secure" 
            : "Add a password to sign in with email"}
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
            {hasPassword && (
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
            )}
            <div>
              <label htmlFor="new" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                {hasPassword ? "New password" : "Password"}
              </label>
              <input 
                id="new"
                className="input" 
                type="password" 
                placeholder={hasPassword ? "Enter new password" : "Create a password"}
                value={nw} 
                onChange={(e) => setNw(e.target.value)} 
              />
              <p className="mt-1 text-xs text-zinc-500">Minimum 8 characters</p>
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Confirm password
              </label>
              <input 
                id="confirm"
                className="input" 
                type="password" 
                placeholder="Confirm password" 
                value={nw2} 
                onChange={(e) => setNw2(e.target.value)} 
              />
            </div>
            <button 
              className="rounded-xl bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              onClick={changePassword}
            >
              {hasPassword ? "Update password" : "Set password"}
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
