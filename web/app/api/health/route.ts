import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Health check endpoint for monitoring and load balancer health checks.
 * Returns 200 if the service is healthy, 503 if database is unreachable.
 */
export async function GET() {
  const start = Date.now();
  
  try {
    // Verify database connectivity with a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    const dbLatency = Date.now() - start;
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: "up",
          latencyMs: dbLatency
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: "down",
            error: error instanceof Error ? error.message : "Unknown error"
          }
        }
      },
      { status: 503 }
    );
  }
}
