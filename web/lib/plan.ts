import { prisma } from "@/lib/db";
import { Plan } from "@prisma/client";

export async function getUserPlan(userId: string): Promise<Plan> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  return u?.plan ?? Plan.FREE;
}

export function isPro(plan: Plan): boolean {
  return plan === Plan.PRO;
}

/**
 * Example gating:
 * FREE: max 200 applications, no CSV export
 * PRO: unlimited + export
 */
export const LIMITS = {
  FREE_MAX_APPLICATIONS: 200
} as const;
