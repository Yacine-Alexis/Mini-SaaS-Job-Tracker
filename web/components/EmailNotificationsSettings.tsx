"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  DigestFrequency,
  DIGEST_FREQUENCY_LABELS,
  DAY_LABELS,
  formatReminderHours,
} from "@/lib/validators/emailPreferences";

type EmailPreferences = {
  id: string;
  interviewReminder: boolean;
  interviewReminderHours: number;
  taskReminder: boolean;
  taskReminderHours: number;
  followUpReminder: boolean;
  statusChangeNotify: boolean;
  digestFrequency: DigestFrequency;
  digestDay: number;
  digestHour: number;
  staleAlertEnabled: boolean;
  staleAlertDays: number;
  marketingEmails: boolean;
  unsubscribedAll: boolean;
};

const REMINDER_HOURS_OPTIONS = [
  { value: 1, label: "1 hour" },
  { value: 2, label: "2 hours" },
  { value: 6, label: "6 hours" },
  { value: 12, label: "12 hours" },
  { value: 24, label: "1 day" },
  { value: 48, label: "2 days" },
  { value: 72, label: "3 days" },
  { value: 168, label: "1 week" },
];

const STALE_DAYS_OPTIONS = [
  { value: 7, label: "1 week" },
  { value: 14, label: "2 weeks" },
  { value: 21, label: "3 weeks" },
  { value: 30, label: "1 month" },
  { value: 60, label: "2 months" },
  { value: 90, label: "3 months" },
];

export default function EmailNotificationsSettings() {
  const { addToast } = useToast();
  const [prefs, setPrefs] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/email-preferences", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to load preferences");
        return;
      }
      setPrefs(data.preferences);
    } catch {
      setErr("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updatePref(updates: Partial<EmailPreferences>) {
    if (!prefs) return;

    // Optimistic update
    setPrefs({ ...prefs, ...updates });
    setSaving(true);

    try {
      const res = await fetch("/api/email-preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) {
        // Revert on error
        await load();
        addToast({ type: "error", title: "Error", message: data?.error?.message ?? "Failed to update" });
        return;
      }

      setPrefs(data.preferences);
      addToast({ type: "success", title: "Preferences updated" });
    } catch {
      await load();
      addToast({ type: "error", title: "Failed to update preferences" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="card p-6">
        <div className="text-red-600 dark:text-red-400">{err}</div>
        <button onClick={load} className="btn btn-sm mt-2">
          Retry
        </button>
      </div>
    );
  }

  if (!prefs) return null;

  return (
    <div className="space-y-6">
      {/* Global Unsubscribe */}
      {prefs.unsubscribedAll && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="font-medium text-amber-700 dark:text-amber-300">
              All email notifications are currently disabled
            </span>
          </div>
          <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
            Enable notifications below to stay updated on your job applications.
          </p>
          <button
            onClick={() => updatePref({ unsubscribedAll: false })}
            className="btn btn-sm mt-3"
            disabled={saving}
          >
            Enable Notifications
          </button>
        </div>
      )}

      {/* Interview Reminders */}
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Interview Reminders
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Get notified before upcoming interviews
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.interviewReminder}
              onChange={(e) => updatePref({ interviewReminder: e.target.checked })}
              className="sr-only peer"
              disabled={saving || prefs.unsubscribedAll}
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {prefs.interviewReminder && !prefs.unsubscribedAll && (
          <div className="mt-3">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Remind me</label>
            <select
              value={prefs.interviewReminderHours}
              onChange={(e) => updatePref({ interviewReminderHours: Number(e.target.value) })}
              className="input mt-1"
              disabled={saving}
            >
              {REMINDER_HOURS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label} before</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Task Reminders */}
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Task Due Date Reminders
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Get notified when tasks are approaching their due date
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.taskReminder}
              onChange={(e) => updatePref({ taskReminder: e.target.checked })}
              className="sr-only peer"
              disabled={saving || prefs.unsubscribedAll}
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {prefs.taskReminder && !prefs.unsubscribedAll && (
          <div className="mt-3">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Remind me</label>
            <select
              value={prefs.taskReminderHours}
              onChange={(e) => updatePref({ taskReminderHours: Number(e.target.value) })}
              className="input mt-1"
              disabled={saving}
            >
              {REMINDER_HOURS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label} before</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Follow-up Reminders */}
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Follow-up Reminders
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Get reminded to follow up on applications with scheduled follow-up dates
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.followUpReminder}
              onChange={(e) => updatePref({ followUpReminder: e.target.checked })}
              className="sr-only peer"
              disabled={saving || prefs.unsubscribedAll}
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Stale Application Alerts */}
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Stale Application Alerts
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Get alerted about applications with no activity
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.staleAlertEnabled}
              onChange={(e) => updatePref({ staleAlertEnabled: e.target.checked })}
              className="sr-only peer"
              disabled={saving || prefs.unsubscribedAll}
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {prefs.staleAlertEnabled && !prefs.unsubscribedAll && (
          <div className="mt-3">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Alert if no activity for</label>
            <select
              value={prefs.staleAlertDays}
              onChange={(e) => updatePref({ staleAlertDays: Number(e.target.value) })}
              className="input mt-1"
              disabled={saving}
            >
              {STALE_DAYS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Digest Emails */}
      <div className="card p-4">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          Digest Emails
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Receive a summary of your job search activity
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Frequency</label>
            <select
              value={prefs.digestFrequency}
              onChange={(e) => updatePref({ digestFrequency: e.target.value as DigestFrequency })}
              className="input mt-1"
              disabled={saving || prefs.unsubscribedAll}
            >
              {Object.entries(DIGEST_FREQUENCY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          {prefs.digestFrequency !== "NEVER" && prefs.digestFrequency !== "DAILY" && !prefs.unsubscribedAll && (
            <div>
              <label className="text-sm text-zinc-600 dark:text-zinc-400">Day of week</label>
              <select
                value={prefs.digestDay}
                onChange={(e) => updatePref({ digestDay: Number(e.target.value) })}
                className="input mt-1"
                disabled={saving}
              >
                {DAY_LABELS.map((label, idx) => (
                  <option key={idx} value={idx}>{label}</option>
                ))}
              </select>
            </div>
          )}
          {prefs.digestFrequency !== "NEVER" && !prefs.unsubscribedAll && (
            <div>
              <label className="text-sm text-zinc-600 dark:text-zinc-400">Time</label>
              <select
                value={prefs.digestHour}
                onChange={(e) => updatePref({ digestHour: Number(e.target.value) })}
                className="input mt-1"
                disabled={saving}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Status Change Notifications */}
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Status Change Notifications
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Get notified when application statuses change (via integrated job boards)
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.statusChangeNotify}
              onChange={(e) => updatePref({ statusChangeNotify: e.target.checked })}
              className="sr-only peer"
              disabled={saving || prefs.unsubscribedAll}
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Marketing Emails */}
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Product Updates & Tips
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Receive occasional tips and feature announcements
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.marketingEmails}
              onChange={(e) => updatePref({ marketingEmails: e.target.checked })}
              className="sr-only peer"
              disabled={saving || prefs.unsubscribedAll}
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Unsubscribe All */}
      <div className="card p-4 border-red-200 dark:border-red-800">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Unsubscribe from All Emails
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Disable all email notifications from JobTracker
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.unsubscribedAll}
              onChange={(e) => updatePref({ unsubscribedAll: e.target.checked })}
              className="sr-only peer"
              disabled={saving}
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500 dark:peer-focus:ring-red-600 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-red-600"></div>
          </label>
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-zinc-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Saving...
        </div>
      )}
    </div>
  );
}
