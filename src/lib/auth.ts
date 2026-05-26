// src/lib/auth.ts
import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";

import type { Role } from "@/types";

// ─────────────────────────────────────────────
// Extensão de tipos
// ─────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
  }
}

// NÃO use "next-auth/jwt" no v5

// ─────────────────────────────────────────────
// Configuração
// ─────────────────────────────────────────────

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
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
        email: {
          label: "E-mail",
          type: "email",
        },

        password: {
          label: "Senha",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: String(credentials.email)
              .toLowerCase()
              .trim(),
          },
        });

        if (!user) return null;

        const validPassword = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash
        );

        if (!validPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }

      return session;
    },
  },
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

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

export async function requireMunicipalityAccess(
  municipalityId: string
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Não autenticado");
  }

  // Admin acessa tudo
  if (session.user.role === "admin") {
    return session;
  }

  // Funcionário só acessa município vinculado
  const link = await db.userMunicipality.findUnique({
    where: {
      userId_municipalityId: {
        userId: session.user.id,
        municipalityId,
      },
    },
  });

  if (!link) {
    throw new Error("Sem acesso a este município");
  }

  return session;
}