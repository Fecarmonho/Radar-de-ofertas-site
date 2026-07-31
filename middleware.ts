import { NextRequest, NextResponse } from "next/server";

/**
 * Checagem rápida (só olha se o cookie existe, não valida a assinatura —
 * isso roda no Edge Runtime, que não suporta o Firebase Admin SDK).
 * A validação de verdade acontece no servidor em cada página/rota
 * protegida (veja lib/admin-session.ts), então isso aqui é só uma
 * melhoria de UX pra redirecionar rápido quem obviamente não está logado.
 */
export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const hasSessionCookie = request.cookies.has("__session");

  if (!isLoginPage && !hasSessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
