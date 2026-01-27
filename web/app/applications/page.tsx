import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ApplicationsClient from "@/components/ApplicationsClient";

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return <ApplicationsClient />;
}
