import { Metadata } from "next";
import SettingsLayout from "@/components/SettingsLayout";
import EmailNotificationsSettings from "@/components/EmailNotificationsSettings";

export const metadata: Metadata = {
  title: "Notification Settings – JobTracker",
  description: "Configure your email notifications and reminders",
};

export default function NotificationsSettingsPage() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Notification Settings</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Configure how and when you receive email notifications about your job applications.
          </p>
        </div>
        <EmailNotificationsSettings />
      </div>
    </SettingsLayout>
  );
}
