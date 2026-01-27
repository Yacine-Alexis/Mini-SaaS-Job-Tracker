import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const logs = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Audit log</h1>
        <p className="text-sm text-zinc-600 mt-1">Last 100 actions.</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b">
            <tr className="text-left">
              <th className="p-3">Time</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b last:border-b-0">
                <td className="p-3 text-zinc-600">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-3"><span className="badge">{l.action}</span></td>
                <td className="p-3 text-zinc-700">
                  {l.entity ? `${l.entity}${l.entityId ? `#${l.entityId}` : ""}` : "-"}
                </td>
                <td className="p-3 text-zinc-600">{l.ip ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
