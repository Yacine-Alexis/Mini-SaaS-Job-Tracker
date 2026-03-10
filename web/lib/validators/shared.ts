import { z } from "zod";
import { Prisma, ApplicationStage, Priority, RemoteType, JobType } from "@prisma/client";

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
  salaryMin?: number;
  salaryMax?: number;
  priority?: Priority;
  remoteType?: RemoteType;
  jobType?: JobType;
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

  // Salary range filter - find applications where salary overlaps with filter range
  if (opts.salaryMin !== undefined || opts.salaryMax !== undefined) {
    // Match if application's salary range overlaps with the filter range
    // An application matches if: app.salaryMax >= filter.salaryMin AND app.salaryMin <= filter.salaryMax
    const salaryConditions: Prisma.JobApplicationWhereInput[] = [];
    
    if (opts.salaryMin !== undefined) {
      // Application's max salary should be >= our min filter (or null for unknown)
      salaryConditions.push({
        OR: [
          { salaryMax: { gte: opts.salaryMin } },
          { salaryMin: { gte: opts.salaryMin } }
        ]
      });
    }
    
    if (opts.salaryMax !== undefined) {
      // Application's min salary should be <= our max filter (or null for unknown)
      salaryConditions.push({
        OR: [
          { salaryMin: { lte: opts.salaryMax } },
          { salaryMax: { lte: opts.salaryMax } }
        ]
      });
    }
    
    if (salaryConditions.length > 0) {
      where.AND = salaryConditions;
    }
  }

  if (opts.priority) {
    where.priority = opts.priority;
  }

  if (opts.remoteType) {
    where.remoteType = opts.remoteType;
  }

  if (opts.jobType) {
    where.jobType = opts.jobType;
  }

  return where;
}
