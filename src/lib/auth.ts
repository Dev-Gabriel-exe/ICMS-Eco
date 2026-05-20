// src/lib/auth.ts
import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role } from "@/types";

// ─────────────────────────────────────────────
// Extensão de tipos do NextAuth
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

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

// ─────────────────────────────────────────────
// Configuração NextAuth
// ─────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
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
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});

// ─────────────────────────────────────────────
// Helpers de autorização
// ─────────────────────────────────────────────

/** Retorna a session ou null — não lança erro */
export async function getAuthSession() {
  return auth();
}

/** Verifica se o usuário logado é admin */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Acesso restrito a administradores");
  }
  return session;
}

/** Verifica se o funcionário tem acesso ao município */
export async function requireMunicipalityAccess(municipalityId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado");

  // Admin tem acesso irrestrito
  if (session.user.role === "admin") return session;

  // Funcionário só vê municípios vinculados
  const link = await db.userMunicipality.findUnique({
    where: {
      userId_municipalityId: {
        userId: session.user.id,
        municipalityId,
      },
    },
  });

  if (!link) throw new Error("Sem acesso a este município");

  return session;
}