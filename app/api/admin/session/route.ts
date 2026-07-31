import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

const SESSION_COOKIE = "__session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14; // 14 dias

/**
 * POST /api/admin/session
 * Recebe o ID token do login (feito no navegador com o Firebase Auth
 * client SDK) e troca por um cookie de sessão httpOnly de longa duração.
 * A partir daqui o navegador nem precisa mais guardar o ID token.
 */
export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: "Token ausente." }, { status: 400 });
  }

  try {
    // Confere que o token é legítimo e recente (evita repasse de token roubado antigo)
    await adminAuth.verifyIdToken(idToken, true);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Falha ao criar sessão de admin", err);
    return NextResponse.json({ error: "Login inválido." }, { status: 401 });
  }
}

/** DELETE /api/admin/session — faz logout removendo o cookie. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
