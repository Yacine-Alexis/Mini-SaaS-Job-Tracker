/**
 * Plan utilities for checking user subscription status and enforcing limits.
 * @module lib/plan
 */

import { prisma } from "@/lib/db";
import { Plan } from "@prisma/client";
import { PLAN_CONFIG } from "./constants";

/**
 * Retrieves the current plan for a user.
 * 
 * @param userId - The unique identifier of the user
 * @returns The user's plan (FREE or PRO). Defaults to FREE if user not found.
 * 
 * @example
 * ```ts
 * const plan = await getUserPlan(userId);
 * if (isPro(plan)) {
 *   // Allow Pro-only features
 * }
 * ```
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  return u?.plan ?? Plan.FREE;
}

/**
 * Checks if a plan is the Pro tier.
 * 
 * @param plan - The plan to check
 * @returns True if the plan is PRO, false otherwise
 * 
 * @example
 * ```ts
 * const plan = await getUserPlan(userId);
 * if (!isPro(plan)) {
 *   return jsonError(403, "PLAN_REQUIRED", "Upgrade to Pro");
 * }
 * ```
 */
export function isPro(plan: Plan): boolean {
  return plan === Plan.PRO;
}

/**
 * Plan limits for feature gating.
 * 
 * - FREE: Limited to {@link LIMITS.FREE_MAX_APPLICATIONS} applications, no CSV export
 * - PRO: Unlimited applications + CSV export
 */
export const LIMITS = {
  /** Maximum number of applications for free tier users */
  FREE_MAX_APPLICATIONS: PLAN_CONFIG.FREE.maxApplications,
} as const;
