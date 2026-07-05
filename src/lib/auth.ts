// src/lib/auth.ts
import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import type { Role } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      avatarUrl?: string | null;
    } & DefaultSession["user"];
  }

  
  interface User {
    id: string;
    role: Role;
    avatarUrl?: string | null;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    avatarUrl?: string | null;
  }
}
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "E-mail", type: "email"    },
        password: { label: "Senha",  type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: String(credentials.email).toLowerCase().trim() },
        });

        if (!user || !user.isActive) return null;

        const validPassword = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash
        );
        if (!validPassword) return null;

        // Registra login no audit
        try {
          await logAction({
            userId: user.id,
            action: "USER_LOGIN",
            entityType: "User",
            entityId: user.id,
            description: `Login realizado por ${user.name}`,
          });
        } catch { /* silencioso */ }

        return {
          id:        user.id,
          name:      user.name,
          email:     user.email,
          role:      user.role as Role,
          avatarUrl: user.avatarUrl ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const jwt = token as JWT & { id?: string; role?: Role; avatarUrl?: string | null };
      if (user) {
        jwt.id        = user.id;
        jwt.role      = user.role;
        jwt.avatarUrl = user.avatarUrl;
      }
      if (trigger === "update" && session?.avatarUrl !== undefined) {
        jwt.avatarUrl = session.avatarUrl as string | null;
      }
      return jwt;
    },
    async session({ session, token }) {
      const jwt = token as JWT & { id?: string; role?: Role; avatarUrl?: string | null };
      if (session.user) {
        session.user.id        = jwt.id as string;
        session.user.role      = jwt.role as Role;
        session.user.avatarUrl = jwt.avatarUrl as string | null;
      }
      return session;
    },
  },
});

// ─── Helpers ────────────────────────────────────────────────────────────────

export async function getAuthSession() {
  return auth();
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Acesso restrito a administradores");
  }
  return session;
}

/** Aceita admin e reviewer */
export async function requireReviewer() {
  const session = await auth();
  if (!session?.user || !["admin", "reviewer"].includes(session.user.role)) {
    throw new Error("Acesso restrito a revisores e administradores");
  }
  return session;
}

export async function requireMunicipalityAccess(municipalityId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado");

  if (session.user.role === "admin") return session;

  const link = await db.userMunicipality.findUnique({
    where: {
      userId_municipalityId: { userId: session.user.id, municipalityId },
    },
  });
  if (!link) throw new Error("Sem acesso a este município");

  return session;
}
