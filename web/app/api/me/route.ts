import { NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, plan: true }
  });

  return NextResponse.json({ user: u });
}
