import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { jsonError, zodToDetails } from "@/lib/errors";

const bodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72)
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
    }

    const email = parsed.data.email.toLowerCase().trim();

    const exists = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true }
    });
    if (exists) return jsonError(409, "BAD_REQUEST", "Email already in use");

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true }
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    return jsonError(500, "INTERNAL_ERROR", "Unexpected error");
  }
}
