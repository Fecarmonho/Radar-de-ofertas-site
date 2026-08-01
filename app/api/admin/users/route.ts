import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { adminAuth } from "@/lib/firebase-admin";
import { createAdminRecord } from "@/lib/admins-db";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { name, email, password } = await request.json();

  if (!name || !email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Preencha nome, email e uma senha com pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  try {
    const userRecord = await adminAuth.createUser({ email, password, displayName: name });
    await createAdminRecord({
      uid: userRecord.uid,
      name,
      email,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message =
      err?.code === "auth/email-already-exists"
        ? "Esse email já está cadastrado no Firebase."
        : err instanceof Error
          ? err.message
          : "Não foi possível criar o usuário.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
