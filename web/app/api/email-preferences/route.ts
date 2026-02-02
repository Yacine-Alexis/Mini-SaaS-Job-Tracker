import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { emailPreferencesUpdateSchema, DEFAULT_EMAIL_PREFERENCES } from "@/lib/validators/emailPreferences";

/**
 * GET /api/email-preferences
 * Get current user's email preferences (creates defaults if not exist)
 */
export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  try {
    // Find or create preferences
    let prefs = await prisma.emailPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.emailPreferences.create({
        data: {
          userId,
          ...DEFAULT_EMAIL_PREFERENCES,
        },
      });
    }

    return NextResponse.json({ preferences: prefs });
  } catch (err) {
    console.error("GET /api/email-preferences error:", err);
    return jsonError(500, "INTERNAL_ERROR", "Failed to load email preferences");
  }
}

/**
 * PATCH /api/email-preferences
 * Update email preferences
 */
export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const body = await req.json();
  const parsed = emailPreferencesUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid preferences data", zodToDetails(parsed.error));
  }

  try {
    // Upsert preferences
    const prefs = await prisma.emailPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...DEFAULT_EMAIL_PREFERENCES,
        ...parsed.data,
      },
      update: parsed.data,
    });

    await audit(req, userId, AuditAction.EMAIL_PREFERENCES_UPDATED, {
      entity: "EmailPreferences",
      entityId: prefs.id,
    });

    return NextResponse.json({ preferences: prefs });
  } catch (err) {
    console.error("PATCH /api/email-preferences error:", err);
    return jsonError(500, "INTERNAL_ERROR", "Failed to update email preferences");
  }
}
