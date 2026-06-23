// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const isAuthRoute      = nextUrl.pathname.startsWith("/login");
  const isAdminRoute     = nextUrl.pathname.startsWith("/admin");
  const isMunicipioRoute = nextUrl.pathname.startsWith("/municipio");
  const isDashboardRoute = isAdminRoute || isMunicipioRoute;

  // Redireciona não-autenticados para login
  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redireciona autenticados que acessam /login
  if (isAuthRoute && isLoggedIn) {
    const redirect = role === "admin" ? "/admin" : "/municipio";
    return NextResponse.redirect(new URL(redirect, nextUrl));
  }

  // Protege rotas /admin — só admin
  if (isAdminRoute && role !== "admin") {
    // reviewer e employee vão para /municipio
    return NextResponse.redirect(new URL("/municipio", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};