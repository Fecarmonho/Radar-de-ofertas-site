import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { scrapeShopeeProduct, Diagnostico } from "@/lib/scrape-shopee";

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
        { error: explicar(data.diagnostico), diagnostico: data.diagnostico },
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

/**
 * Transforma o que aconteceu na conversa com a Shopee numa frase que diz
 * o que fazer. Sem isso qualquer falha virava o mesmo "não consegui ler
 * o link", e não dava para saber se o problema era o link, a Shopee ou
 * o tempo.
 */
function explicar(d?: Diagnostico): string {
  if (!d) return "Não consegui ler os dados desse link. Preencha na mão.";

  if (d.demorou) {
    return "A Shopee demorou demais para responder. Tente de novo em alguns segundos ou preencha na mão.";
  }

  if (d.status === 403 || d.status === 429) {
    return `A Shopee recusou o acesso do servidor (código ${d.status}). Ela às vezes bloqueia pedidos que não vêm de um navegador. Preencha na mão desta vez.`;
  }

  if (d.naoResolveu) {
    return "Esse link curto não abriu até a página do produto. Cole o link completo (o endereço que tem -i.123.456 no final) ou preencha na mão.";
  }

  if (d.status === 0) {
    return "Não consegui nem chegar na Shopee a partir do servidor. Tente de novo ou preencha na mão.";
  }

  return `A Shopee respondeu (código ${d.status}), mas sem os dados do produto — acontece com item de campanha. Preencha na mão.`;
}
