import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SettingsLayout, { SettingsCard } from "@/components/SettingsLayout";

// Action to human-readable label mapping
const actionLabels: Record<string, { label: string; color: string }> = {
  AUTH_LOGIN: { label: "Logged in", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
  AUTH_LOGOUT: { label: "Logged out", color: "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300" },
  AUTH_PASSWORD_RESET: { label: "Password reset", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  APPLICATION_CREATED: { label: "Created application", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  APPLICATION_UPDATED: { label: "Updated application", color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" },
  APPLICATION_DELETED: { label: "Deleted application", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  NOTE_CREATED: { label: "Created note", color: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400" },
  NOTE_UPDATED: { label: "Updated note", color: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400" },
  NOTE_DELETED: { label: "Deleted note", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  TASK_CREATED: { label: "Created task", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" },
  TASK_UPDATED: { label: "Updated task", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" },
  TASK_DELETED: { label: "Deleted task", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  CONTACT_CREATED: { label: "Added contact", color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400" },
  CONTACT_UPDATED: { label: "Updated contact", color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400" },
  CONTACT_DELETED: { label: "Deleted contact", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  LINK_CREATED: { label: "Added link", color: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400" },
  LINK_UPDATED: { label: "Updated link", color: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400" },
  LINK_DELETED: { label: "Deleted link", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  EXPORT_CSV: { label: "Exported CSV", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  BILLING_UPGRADED: { label: "Upgraded plan", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  BILLING_DOWNGRADED: { label: "Downgraded plan", color: "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300" },
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const logs = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <SettingsCard 
          title="Activity Log" 
          description="Your recent account activity and actions"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing the last 100 actions. Activity is logged for security and auditing purposes.
          </p>
        </SettingsCard>

        {logs.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-white">No activity yet</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Your actions will appear here as you use the app.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Time</th>
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Action</th>
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Entity</th>
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                  {logs.map((log) => {
                    const actionInfo = actionLabels[log.action] || { label: log.action, color: "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400" };
                    return (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                          <div className="flex flex-col">
                            <span>{formatRelativeTime(new Date(log.createdAt))}</span>
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${actionInfo.color}`}>
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                          {log.entity ? (
                            <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">
                              {log.entity}{log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}
                            </span>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                          {log.ip || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-700">
              {logs.map((log) => {
                const actionInfo = actionLabels[log.action] || { label: log.action, color: "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400" };
                return (
                  <div key={log.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${actionInfo.color}`}>
                        {actionInfo.label}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatRelativeTime(new Date(log.createdAt))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {log.entity ? `${log.entity}${log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}` : "—"}
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-500 font-mono">
                        {log.ip || "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}
