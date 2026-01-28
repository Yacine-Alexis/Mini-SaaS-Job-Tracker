import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/errors";

// Admin credentials from environment variables
// Set these in .env: ADMIN_EMAIL and ADMIN_PASSWORD
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_ID = "admin-user-id-12345";

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

        // Check for admin login first
        if (ADMIN_EMAIL && ADMIN_PASSWORD && email === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
          // Ensure admin user exists in DB with PRO plan
          const adminUser = await prisma.user.upsert({
            where: { id: ADMIN_ID },
            update: { plan: "PRO" },
            create: {
              id: ADMIN_ID,
              email: ADMIN_EMAIL.toLowerCase(),
              passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
              plan: "PRO"
            }
          });
          return { id: adminUser.id, email: adminUser.email };
        }

        const user = await prisma.user.findFirst({
          where: { email, deletedAt: null }
        });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // @ts-expect-error – extend session.user at runtime
        session.user.id = token.sub;
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
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return null;
  return userId;
}

// Handy for route handlers
export async function requireUserOr401() {
  const userId = await requireUserId();
  if (!userId) return { userId: null, error: jsonError(401, "UNAUTHORIZED", "Please sign in.") };
  return { userId, error: null };
}
