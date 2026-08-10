import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { resolverProdutoPorLink } from "@/lib/anuncios/platform-adapters";
import { AnuncioOrigem } from "@/lib/anuncios/types";

export const dynamic = "force-dynamic";
/** Mesma folga da rota de scrape de produto: ler a página + baixar a foto pode levar alguns segundos. */
export const maxDuration = 30;

const ORIGENS_VALIDAS: AnuncioOrigem[] = ["shopee", "amazon", "pinterest"];

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { origem, url } = await request.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Link não informado." }, { status: 400 });
  }
  if (!ORIGENS_VALIDAS.includes(origem)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 400 });
  }

  try {
    const resultado = await resolverProdutoPorLink(origem, url);

    if (resultado.ok) {
      return NextResponse.json({ produto: resultado.produto });
    }
    if (!resultado.suportado) {
      return NextResponse.json({ suportado: false, aviso: resultado.aviso });
    }
    return NextResponse.json({ error: resultado.error }, { status: 422 });
  } catch (err) {
    console.error("[anuncios] erro inesperado ao resolver produto", err);
    return NextResponse.json(
      { error: "Erro inesperado ao ler o link. Preencha os campos na mão." },
      { status: 500 }
    );
  }
}
