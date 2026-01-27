import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ApplicationDetailsClient from "@/components/ApplicationDetailsClient";

export default async function ApplicationDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return <ApplicationDetailsClient id={params.id} />;
}
