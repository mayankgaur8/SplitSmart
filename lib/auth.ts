import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "USER" as UserRole,
        };
      },
    }),

    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            plan: true,
            planStatus: true,
            emailVerified: true,
            passwordHash: true,
            reputationScore: true,
            paymentStreak: true,
          },
        });

        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          plan: user.plan,
          planStatus: user.planStatus,
          reputationScore: user.reputationScore,
          paymentStreak: user.paymentStreak,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On sign-in, attach extra fields
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role ?? "USER";
        token.plan = (user as { plan?: string }).plan ?? "FREE";
        token.planStatus = (user as { planStatus?: string }).planStatus ?? "ACTIVE";
        token.reputationScore = (user as { reputationScore?: number }).reputationScore ?? 0;
        token.paymentStreak = (user as { paymentStreak?: number }).paymentStreak ?? 0;
      }
      // On session update, refresh from DB
      if (trigger === "update" && session?.refreshFromDb) {
        const fresh = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true, plan: true, planStatus: true,
            reputationScore: true, paymentStreak: true,
          },
        });
        if (fresh) {
          token.role = fresh.role;
          token.plan = fresh.plan;
          token.planStatus = fresh.planStatus;
          token.reputationScore = fresh.reputationScore;
          token.paymentStreak = fresh.paymentStreak;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as { role?: UserRole }).role = token.role as UserRole;
        (session.user as { plan?: string }).plan = token.plan as string;
        (session.user as { planStatus?: string }).planStatus = token.planStatus as string;
        (session.user as { reputationScore?: number }).reputationScore = token.reputationScore as number;
        (session.user as { paymentStreak?: number }).paymentStreak = token.paymentStreak as number;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser && user.id) {
        // Award "Early Adopter" badge if first 10k users
        const userCount = await db.user.count();
        if (userCount <= 10000) {
          const badge = await db.badge.findUnique({
            where: { slug: "early_adopter" },
          });
          if (badge) {
            await db.userBadge
              .create({ data: { userId: user.id, badgeId: badge.id } })
              .catch(() => {}); // idempotent
          }
        }
        // Log
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: "USER_CREATED",
            resource: "User",
            resourceId: user.id,
          },
        });
      }
    },
  },
});

// ─── Helper: require session in API routes ────────────────────────────────────

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("Unauthorized", 401);
  }
  return session.user as SessionUser;
}

export async function requireVerifiedAuth() {
  const user = await requireAuth();
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { email: true, emailVerified: true, emailVerifiedRequired: true },
  });
  if (dbUser?.email && dbUser.emailVerifiedRequired && !dbUser.emailVerified) {
    throw new AuthError("Email verification required", 403);
  }
  return user;
}

export async function requireRole(
  role: "GROUP_ADMIN" | "TEAM_ADMIN" | "SUPER_ADMIN"
) {
  const user = await requireAuth();
  const roles: Record<string, number> = {
    USER: 0, GROUP_ADMIN: 1, TEAM_ADMIN: 2, SUPER_ADMIN: 3,
  };
  const required = roles[role] ?? 0;
  const actual = roles[(user as { role?: string }).role ?? "USER"] ?? 0;
  if (actual < required) throw new AuthError("Forbidden", 403);
  return user;
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "AuthError";
  }
}

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
  plan?: string;
  planStatus?: string;
  reputationScore?: number;
  paymentStreak?: number;
};
