import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-session";
import {
  isSiteState,
  limparTexto,
  saveSiteStatus,
  TEXTO_PADRAO,
} from "@/lib/site-status-db";

export async function PUT(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { state, construcao, manutencao } = await request.json();

  if (!isSiteState(state)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  await saveSiteStatus(
    {
      state,
      textos: {
        construcao: limparTexto(construcao, TEXTO_PADRAO.construcao),
        manutencao: limparTexto(manutencao, TEXTO_PADRAO.manutencao),
      },
    },
    session.email ?? session.uid
  );

  // As páginas do site ficam 60s em cache. Sem isto, tirar o site do ar
  // levaria até um minuto para acontecer de verdade — tempo demais para
  // um botão de emergência.
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
