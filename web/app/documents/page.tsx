import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DocumentsClient from "@/components/DocumentsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents | JobTracker",
  description: "Manage your resumes, cover letters, and other application documents",
};

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <DocumentsClient />
    </main>
  );
}
