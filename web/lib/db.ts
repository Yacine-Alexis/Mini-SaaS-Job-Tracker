import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
    // Connection pooling is configured via DATABASE_URL query params:
    // ?connection_limit=10&pool_timeout=20
    // Or use Prisma Accelerate/PgBouncer in production
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
