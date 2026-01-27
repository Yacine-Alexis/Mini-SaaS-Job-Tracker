import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ApplicationForm from "@/components/ApplicationForm";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditApplicationPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await params;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Edit application</h1>
        <p className="text-sm text-zinc-600">Update fields and save.</p>
      </div>
      <ApplicationForm mode="edit" id={id} />
    </div>
  );
}
