/**
 * Authentication utilities and NextAuth configuration.
 * @module lib/auth
 */

import { getServerSession } from "next-auth";
import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
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
 * Uses JWT strategy with credentials, Google, and GitHub providers.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    // Email/Password credentials
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

        // OAuth-only users cannot login with credentials
        if (!user.passwordHash) {
          throw new Error("This account uses social login. Please sign in with Google or GitHub.");
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
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in - create or link user
      if (account && account.provider !== "credentials") {
        const email = user.email?.toLowerCase().trim();
        if (!email) return false;

        try {
          // Check if user exists
          let dbUser = await prisma.user.findFirst({
            where: { email, deletedAt: null },
            include: { accounts: true }
          });

          if (!dbUser) {
            // Create new user for OAuth
            dbUser = await prisma.user.create({
              data: {
                email,
                name: user.name || profile?.name || null,
                image: user.image || null,
                passwordHash: null, // OAuth users don't have passwords
                accounts: {
                  create: {
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token,
                    refresh_token: account.refresh_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    session_state: account.session_state as string | undefined,
                  }
                }
              },
              include: { accounts: true }
            });
          } else {
            // Check if this OAuth account is already linked
            const existingAccount = dbUser.accounts.find(
              a => a.provider === account.provider && a.providerAccountId === account.providerAccountId
            );

            if (!existingAccount) {
              // Link new OAuth provider to existing user
              await prisma.account.create({
                data: {
                  userId: dbUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state as string | undefined,
                }
              });
            }
          }

          // Set the user ID so JWT callback gets it
          user.id = dbUser.id;
          user.plan = dbUser.plan;
        } catch (error) {
          console.error("OAuth sign-in error:", error);
          return false;
        }
      }
      return true;
    }
  },
  pages: {
    signIn: "/login",
    error: "/auth/error"
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
