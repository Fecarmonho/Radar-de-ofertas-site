import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { adminAuth } from "@/lib/firebase-admin";
import { deleteAdminRecord } from "@/lib/admins-db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { uid: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (session.uid === params.uid) {
    return NextResponse.json(
      { error: "Você não pode remover o próprio usuário logado." },
      { status: 400 }
    );
  }

  try {
    await adminAuth.deleteUser(params.uid);
  } catch {
    // Se já não existir no Auth, segue o jogo e limpa o registro mesmo assim.
  }
  await deleteAdminRecord(params.uid);

  return NextResponse.json({ ok: true });
}
