"use client";

import { useState, useEffect, useCallback } from "react";
import SettingsLayout, { SettingsCard } from "@/components/SettingsLayout";
import { ConfirmModal } from "@/components/ui/Modal";

interface Session {
  id: string;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ip: string | null;
  country: string | null;
  city: string | null;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface TwoFactorStatus {
  enabled: boolean;
  backupCodesCount: number;
}

interface TwoFactorSetup {
  qrCodeDataUrl: string;
  backupCodes: string[];
}

function DeviceIcon({ type }: { type: string | null }) {
  if (type === "mobile") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  if (type === "tablet") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  // desktop / unknown
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString();
}

function SessionCard({ 
  session, 
  onRevoke 
}: { 
  session: Session; 
  onRevoke: (id: string) => void;
}) {
  const deviceInfo = [session.browser, session.os].filter(Boolean).join(" on ");
  const location = [session.city, session.country].filter(Boolean).join(", ");

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
      <div className={`p-2 rounded-lg ${session.isCurrent 
        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"}`}>
        <DeviceIcon type={session.deviceType} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
            {deviceInfo || "Unknown device"}
          </p>
          {session.isCurrent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Current
            </span>
          )}
        </div>
        
        <div className="mt-1 space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {location && <p>{location}</p>}
          {session.ip && <p>IP: {session.ip}</p>}
          <p>Last active: {formatRelativeTime(session.lastActiveAt)}</p>
          <p>Signed in: {new Date(session.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {!session.isCurrent && (
        <button
          onClick={() => onRevoke(session.id)}
          className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Revoke
        </button>
      )}
    </div>
  );
}

export default function SecuritySettingsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokeAllModalOpen, setRevokeAllModalOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  // 2FA state
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = await res.json();
      setSessions(data.sessions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  const load2FAStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/2fa");
      if (!res.ok) throw new Error("Failed to load 2FA status");
      const data = await res.json();
      setTwoFactorStatus(data);
    } catch (e) {
      console.error("Failed to load 2FA status:", e);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    load2FAStatus();
  }, [loadSessions, load2FAStatus]);

  async function start2FASetup() {
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to start 2FA setup");
      }
      const data = await res.json();
      setTwoFactorSetup(data);
    } catch (e) {
      setTwoFactorError(e instanceof Error ? e.message : "Failed to start 2FA setup");
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function enable2FA() {
    if (verificationCode.length !== 6) {
      setTwoFactorError("Please enter a 6-digit code");
      return;
    }
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", code: verificationCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid code");
      }
      setTwoFactorSetup(null);
      setVerificationCode("");
      setShowBackupCodes(true);
      load2FAStatus();
    } catch (e) {
      setTwoFactorError(e instanceof Error ? e.message : "Failed to enable 2FA");
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function disable2FA() {
    if (disableCode.length < 6) {
      setTwoFactorError("Please enter a valid code");
      return;
    }
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", code: disableCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid code");
      }
      setDisableModalOpen(false);
      setDisableCode("");
      load2FAStatus();
    } catch (e) {
      setTwoFactorError(e instanceof Error ? e.message : "Failed to disable 2FA");
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function revokeSession(id: string) {
    try {
      const res = await fetch(`/api/sessions?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to revoke session");
      }
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke session");
    }
  }

  async function revokeAllSessions() {
    setRevoking(true);
    try {
      const res = await fetch("/api/sessions?all=true", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke sessions");
      const data = await res.json();
      setSessions(prev => prev.filter(s => s.isCurrent));
      setRevokeAllModalOpen(false);
      alert(data.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke sessions");
    } finally {
      setRevoking(false);
    }
  }

  const otherSessions = sessions.filter(s => !s.isCurrent);

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Active Sessions */}
        <SettingsCard
          title="Active Sessions"
          description="Manage your active sessions across devices. Revoke access from any device you don't recognize."
        >
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={() => { setError(null); loadSessions(); }}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Try again
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No active sessions found.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onRevoke={revokeSession}
                />
              ))}
            </div>
          )}

          {otherSessions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setRevokeAllModalOpen(true)}
                className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Revoke all other sessions
              </button>
            </div>
          )}
        </SettingsCard>

        {/* Two-Factor Authentication */}
        <SettingsCard
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account by requiring a verification code in addition to your password."
        >
          {twoFactorStatus === null ? (
            <div className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ) : twoFactorStatus.enabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Two-factor authentication is enabled</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {twoFactorStatus.backupCodesCount} backup codes remaining
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDisableModalOpen(true)}
                className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Disable two-factor authentication
              </button>
            </div>
          ) : twoFactorSetup ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={twoFactorSetup.qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Enter verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="input text-center tracking-widest"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              {twoFactorError && (
                <p className="text-sm text-red-600 dark:text-red-400">{twoFactorError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTwoFactorSetup(null);
                    setVerificationCode("");
                    setTwoFactorError(null);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={enable2FA}
                  disabled={twoFactorLoading || verificationCode.length !== 6}
                  className="btn btn-primary flex-1"
                >
                  {twoFactorLoading ? "Verifying..." : "Enable"}
                </button>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Save your backup codes</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                  Store these codes safely. You can use them to access your account if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {twoFactorSetup.backupCodes.map((code, i) => (
                    <div key={i} className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-800/30 text-amber-800 dark:text-amber-200">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your phone when signing in.
              </p>
              <button
                onClick={start2FASetup}
                disabled={twoFactorLoading}
                className="btn btn-primary"
              >
                {twoFactorLoading ? "Loading..." : "Set up two-factor authentication"}
              </button>
            </div>
          )}
        </SettingsCard>

        {/* Security Tips */}
        <SettingsCard
          title="Security Tips"
          description="Best practices to keep your account secure"
        >
          <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Use a strong, unique password for your account</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Enable two-factor authentication for added security</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Regularly review your active sessions</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Keep your backup codes in a safe place</span>
            </li>
          </ul>
        </SettingsCard>
      </div>

      {/* Revoke All Modal */}
      <ConfirmModal
        open={revokeAllModalOpen}
        onClose={() => setRevokeAllModalOpen(false)}
        onConfirm={revokeAllSessions}
        title="Revoke All Sessions"
        message={`This will sign you out from ${otherSessions.length} other device${otherSessions.length === 1 ? "" : "s"}. Your current session will remain active.`}
        confirmText={revoking ? "Revoking..." : "Revoke All"}
        variant="danger"
        loading={revoking}
      />

      {/* Disable 2FA Modal */}
      <ConfirmModal
        open={disableModalOpen}
        onClose={() => {
          setDisableModalOpen(false);
          setDisableCode("");
          setTwoFactorError(null);
        }}
        onConfirm={disable2FA}
        title="Disable Two-Factor Authentication"
        message={
          <div className="space-y-4">
            <p>Enter your authenticator code or a backup code to disable two-factor authentication.</p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9A-Za-z\-]*"
              maxLength={9}
              className="input text-center tracking-widest w-full"
              placeholder="000000"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
            />
            {twoFactorError && (
              <p className="text-sm text-red-600">{twoFactorError}</p>
            )}
          </div>
        }
        confirmText={twoFactorLoading ? "Disabling..." : "Disable 2FA"}
        variant="danger"
        loading={twoFactorLoading}
      />
    </SettingsLayout>
  );
}
