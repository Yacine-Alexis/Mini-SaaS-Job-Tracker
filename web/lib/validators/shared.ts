import { z } from "zod";
import { Prisma, ApplicationStage } from "@prisma/client";

/**
 * Shared query schema for listing items by applicationId
 * Used by notes, tasks, contacts, and attachment-links routes
 */
export const listByApplicationSchema = z.object({
  applicationId: z.string().min(1)
});

/**
 * Type-safe filter builder for JobApplication queries
 */
export type JobApplicationWhereInput = Prisma.JobApplicationWhereInput;

export function buildApplicationFilter(opts: {
  userId: string;
  stage?: ApplicationStage;
  q?: string;
  tags?: string[];
  from?: string;
  to?: string;
}): JobApplicationWhereInput {
  const where: JobApplicationWhereInput = {
    userId: opts.userId,
    deletedAt: null
  };

  if (opts.stage) {
    where.stage = opts.stage;
  }

  if (opts.q) {
    where.OR = [
      { company: { contains: opts.q, mode: "insensitive" } },
      { title: { contains: opts.q, mode: "insensitive" } },
      { location: { contains: opts.q, mode: "insensitive" } }
    ];
  }

  if (opts.tags && opts.tags.length > 0) {
    where.tags = { hasSome: opts.tags };
  }

  if (opts.from || opts.to) {
    where.appliedDate = {};
    if (opts.from) where.appliedDate.gte = new Date(opts.from);
    if (opts.to) where.appliedDate.lte = new Date(opts.to);
  }

  return where;
}
