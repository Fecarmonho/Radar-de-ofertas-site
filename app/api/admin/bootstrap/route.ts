import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { countAdmins, createAdminRecord } from "@/lib/admins-db";

/** GET — diz se já existe algum usuário cadastrado (decide qual tela mostrar no login). */
export async function GET() {
  const count = await countAdmins();
  return NextResponse.json({ hasAdmins: count > 0 });
}

/**
 * POST — cria o primeiro usuário do painel. SEM checar sessão de propósito
 * (ninguém está logado ainda!) — a segurança aqui é: só funciona enquanto
 * não existir NENHUM admin. Depois do primeiro criado, essa rota sempre
 * recusa, e novos usuários só podem ser criados por quem já está logado
 * (veja /api/admin/users).
 */
export async function POST(request: NextRequest) {
  const existing = await countAdmins();
  if (existing > 0) {
    return NextResponse.json(
      { error: "Já existe um usuário principal. Peça pra ele criar seu acesso." },
      { status: 403 }
    );
  }

  const { name, email, password } = await request.json();

  if (!name || !email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Preencha nome, email e uma senha com pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  try {
    let uid: string;
    try {
      const userRecord = await adminAuth.createUser({ email, password, displayName: name });
      uid = userRecord.uid;
    } catch (err: any) {
      if (err?.code !== "auth/email-already-exists") throw err;
      // Esse email já existe no Firebase Authentication (por exemplo, foi
      // criado manualmente pelo Console antes dessa tela existir). Em vez
      // de falhar, "adotamos" essa conta como o usuário principal.
      const existing = await adminAuth.getUserByEmail(email);
      uid = existing.uid;
    }

    await createAdminRecord({ uid, name, email, createdAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : "Não foi possível criar o usuário.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
