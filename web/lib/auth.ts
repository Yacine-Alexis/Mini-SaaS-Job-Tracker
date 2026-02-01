import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/errors";
import type { Plan } from "@prisma/client";

// Extend JWT type to include plan
declare module "next-auth/jwt" {
  interface JWT {
    plan?: Plan;
    planUpdatedAt?: number;
  }
}

// Extend Session type to include plan
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      plan: Plan;
    };
  }
}

// How often to refresh plan from database (5 minutes)
const PLAN_CACHE_TTL = 5 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";

        if (!email || !password) return null;

        // All users (including admins) are authenticated via database
        const user = await prisma.user.findFirst({
          where: { email, deletedAt: null },
          select: { id: true, email: true, passwordHash: true, plan: true }
        });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, plan: user.plan };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign in, store plan from user object
      if (user) {
        token.sub = user.id;
        token.plan = (user as any).plan;
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

export async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;
  return userId;
}

// Get user ID and plan from session (plan is cached in JWT)
export async function requireUserWithPlan() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const plan = session?.user?.plan ?? "FREE";
  if (!userId) return { userId: null, plan: null };
  return { userId, plan };
}

// Handy for route handlers
export async function requireUserOr401() {
  const userId = await requireUserId();
  if (!userId) return { userId: null, error: jsonError(401, "UNAUTHORIZED", "Please sign in.") };
  return { userId, error: null };
}

// Get user ID and plan, or return 401 error
export async function requireUserWithPlanOr401() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const plan = session?.user?.plan ?? "FREE";
  if (!userId) return { userId: null, plan: null, error: jsonError(401, "UNAUTHORIZED", "Please sign in.") };
  return { userId, plan, error: null };
}
