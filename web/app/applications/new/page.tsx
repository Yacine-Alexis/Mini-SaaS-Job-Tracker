import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ApplicationForm from "@/components/ApplicationForm";

export default async function NewApplicationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">New application</h1>
        <p className="text-sm text-zinc-600">Create a new job application.</p>
      </div>
      <ApplicationForm mode="create" />
    </div>
  );
}
