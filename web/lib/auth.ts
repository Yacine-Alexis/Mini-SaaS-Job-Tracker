/**
 * Authentication utilities and NextAuth configuration.
 * @module lib/auth
 */

import { getServerSession } from "next-auth";
import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/errors";
import {
  getAttemptKey,
  checkLoginAllowed,
  recordFailedAttempt,
  clearLoginAttempts,
  formatLockoutDuration,
} from "@/lib/loginThrottle";
import type { Plan } from "@prisma/client";

// Extend JWT type to include plan
declare module "next-auth/jwt" {
  interface JWT {
    plan?: Plan;
    planUpdatedAt?: number;
  }
}

// Extend User type from authorize() to include plan
declare module "next-auth" {
  interface User {
    plan?: Plan;
  }
  interface Session {
    user: {
      id: string;
      email?: string | null;
      plan: Plan;
    };
  }
}

/** How often to refresh plan from database (5 minutes) */
const PLAN_CACHE_TTL = 5 * 60 * 1000;

/**
 * Custom error class for throttled login attempts
 */
export class LoginThrottledError extends Error {
  constructor(
    message: string,
    public remainingAttempts: number,
    public lockedUntilMs: number | null
  ) {
    super(message);
    this.name = "LoginThrottledError";
  }
}

/**
 * NextAuth configuration options.
 * Uses JWT strategy with credentials provider (email/password).
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        clientIp: { label: "Client IP", type: "hidden" }
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";
        // Client IP passed from login page (extracted from headers)
        const clientIp = credentials?.clientIp || "unknown";

        if (!email || !password) return null;

        // Check if login is throttled
        const attemptKey = getAttemptKey(clientIp, email);
        const throttleStatus = checkLoginAllowed(attemptKey);
        
        if (!throttleStatus.allowed) {
          const duration = formatLockoutDuration(throttleStatus.retryAfterMs || 60000);
          throw new LoginThrottledError(
            `Too many failed attempts. Try again in ${duration}.`,
            0,
            throttleStatus.lockedUntilMs
          );
        }

        // All users (including admins) are authenticated via database
        const user = await prisma.user.findFirst({
          where: { email, deletedAt: null },
          select: { id: true, email: true, passwordHash: true, plan: true }
        });
        
        if (!user) {
          // Record failed attempt (user not found)
          const result = recordFailedAttempt(attemptKey, clientIp, email);
          if (result.locked) {
            const duration = formatLockoutDuration(result.lockoutDurationMs || 60000);
            throw new LoginThrottledError(
              `Too many failed attempts. Account locked for ${duration}.`,
              0,
              result.lockedUntilMs
            );
          }
          if (result.remainingAttempts <= 2) {
            throw new Error(`Invalid credentials. ${result.remainingAttempts} attempts remaining.`);
          }
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          // Record failed attempt (wrong password)
          const result = recordFailedAttempt(attemptKey, clientIp, email);
          if (result.locked) {
            const duration = formatLockoutDuration(result.lockoutDurationMs || 60000);
            throw new LoginThrottledError(
              `Too many failed attempts. Account locked for ${duration}.`,
              0,
              result.lockedUntilMs
            );
          }
          if (result.remainingAttempts <= 2) {
            throw new Error(`Invalid credentials. ${result.remainingAttempts} attempts remaining.`);
          }
          return null;
        }

        // Successful login - clear attempts
        clearLoginAttempts(attemptKey);
        
        return { id: user.id, email: user.email, plan: user.plan };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign in, store plan from user object
      if (user) {
        token.sub = user.id;
        token.plan = user.plan;
        token.planUpdatedAt = Date.now();
      }
      
      // Refresh plan from database periodically or on update trigger
      if (token.sub && (trigger === "update" || !token.planUpdatedAt || Date.now() - token.planUpdatedAt > PLAN_CACHE_TTL)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { plan: true }
          });
          if (dbUser) {
            token.plan = dbUser.plan;
            token.planUpdatedAt = Date.now();
          }
        } catch {
          // On error, keep existing plan value
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.plan = token.plan ?? "FREE";
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
};

/**
 * Gets the current user's ID from the session.
 * 
 * @returns The user ID if authenticated, null otherwise
 * 
 * @example
 * ```ts
 * const userId = await requireUserId();
 * if (!userId) {
 *   redirect("/login");
 * }
 * ```
 */
export async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;
  return userId;
}

/**
 * Gets the current user's ID and plan from the session.
 * Plan is cached in the JWT and refreshed periodically.
 * 
 * @returns Object with userId and plan, or nulls if not authenticated
 */
export async function requireUserWithPlan(): Promise<{ userId: string | null; plan: Plan | null }> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const plan = session?.user?.plan ?? "FREE";
  if (!userId) return { userId: null, plan: null };
  return { userId, plan };
}

/**
 * Gets the user ID or returns a 401 error response.
 * Use this in API route handlers.
 * 
 * @returns Object with userId (if authenticated) or error response
 * 
 * @example
 * ```ts
 * export async function GET(req: NextRequest) {
 *   const { userId, error } = await requireUserOr401();
 *   if (error) return error;
 *   
 *   // userId is guaranteed to be defined here
 *   const data = await getData(userId);
 *   return NextResponse.json(data);
 * }
 * ```
 */
export async function requireUserOr401(): Promise<
  { userId: string; error: null } | { userId: null; error: ReturnType<typeof jsonError> }
> {
  const userId = await requireUserId();
  if (!userId) return { userId: null, error: jsonError(401, "UNAUTHORIZED", "Please sign in.") };
  return { userId, error: null };
}

/**
 * Gets the user ID and plan, or returns a 401 error response.
 * Use this in API route handlers that need plan information.
 * 
 * @returns Object with userId and plan (if authenticated) or error response
 * 
 * @example
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const { userId, plan, error } = await requireUserWithPlanOr401();
 *   if (error) return error;
 *   
 *   if (!isPro(plan)) {
 *     return jsonError(403, "PLAN_REQUIRED", "Pro required");
 *   }
 * }
 * ```
 */
export async function requireUserWithPlanOr401(): Promise<
  { userId: string; plan: Plan; error: null } | { userId: null; plan: null; error: ReturnType<typeof jsonError> }
> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const plan = session?.user?.plan ?? "FREE";
  if (!userId) return { userId: null, plan: null, error: jsonError(401, "UNAUTHORIZED", "Please sign in.") };
  return { userId, plan, error: null };
}
