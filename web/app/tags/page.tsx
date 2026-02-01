import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TagsLabelsClient from "@/components/TagsLabelsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tags & Labels | JobTracker",
  description: "Manage your tags and labels to organize job applications",
};

export default async function TagsLabelsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <TagsLabelsClient />
    </main>
  );
}
