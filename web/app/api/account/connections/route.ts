/**
 * API endpoint to get and manage user's connected OAuth accounts.
 * 
 * GET /api/account/connections
 * Returns: { accounts: Array<{ provider: string, connectedAt: Date }>, hasPassword: boolean }
 * 
 * DELETE /api/account/connections?provider=google|github
 * Disconnects an OAuth provider from the user's account
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

export async function GET() {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordHash: true,
      accounts: {
        select: {
          provider: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return jsonError(404, "NOT_FOUND", "User not found");
  }

  return NextResponse.json({
    accounts: user.accounts.map((a) => ({
      provider: a.provider,
      connectedAt: a.createdAt,
    })),
    hasPassword: !!user.passwordHash,
  });
}

export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");

  if (!provider || !["google", "github"].includes(provider)) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid provider. Must be 'google' or 'github'.");
  }

  // Get user with accounts
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordHash: true,
      accounts: {
        select: {
          id: true,
          provider: true,
        },
      },
    },
  });

  if (!user) {
    return jsonError(404, "NOT_FOUND", "User not found");
  }

  // Find the account to disconnect
  const accountToRemove = user.accounts.find((a) => a.provider === provider);
  if (!accountToRemove) {
    return jsonError(404, "NOT_FOUND", `No ${provider} account connected`);
  }

  // Ensure user has at least one way to sign in after disconnection
  const remainingAccounts = user.accounts.filter((a) => a.provider !== provider);
  const hasPassword = !!user.passwordHash;

  if (!hasPassword && remainingAccounts.length === 0) {
    return jsonError(
      400,
      "BAD_REQUEST",
      "Cannot disconnect this account. You need at least one way to sign in. Set a password first or connect another provider."
    );
  }

  // Delete the OAuth account
  await prisma.account.delete({
    where: { id: accountToRemove.id },
  });

  await audit(req, userId, AuditAction.APPLICATION_UPDATED, {
    entity: "Account",
    meta: { action: "OAuth account disconnected", provider },
  });

  return NextResponse.json({
    success: true,
    message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account disconnected`,
  });
}
