import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { scrapeShopeeProduct, explicarDiagnostico } from "@/lib/scrape-shopee";

export const dynamic = "force-dynamic";
/**
 * Ler a página da Shopee custa até três requisições em sequência. O
 * limite padrão de 10s da Vercel derrubava a chamada no meio e o painel
 * mostrava um erro genérico de rede.
 */
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Link não informado." }, { status: 400 });
  }

  try {
    const data = await scrapeShopeeProduct(url);

    if (!data.title && !data.image) {
      console.warn("[scrape] sem dados", JSON.stringify(data.diagnostico));
      return NextResponse.json(
        { error: explicarDiagnostico(data.diagnostico), diagnostico: data.diagnostico },
        { status: 422 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[scrape] erro inesperado", err);
    return NextResponse.json(
      { error: "Erro inesperado ao ler o link. Preencha os campos na mão." },
      { status: 500 }
    );
  }
}
