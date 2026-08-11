import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { chamarGeminiJSON, IAIndisponivelError } from "@/lib/anuncios/ai";
import { gerarSugestaoTexto } from "@/lib/anuncios/templates";
import { AnuncioDestino, AnuncioEstilo, ProdutoAnuncio } from "@/lib/anuncios/types";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

const DESCRICAO_ESTILO: Record<AnuncioEstilo, string> = {
  clean: "clean, direto ao ponto, sem exagero",
  "gancho-forte": "gancho forte, senso de urgência, bem chamativo",
  beneficio: "focado no benefício principal do produto pro dia a dia de quem compra",
  "ugc-review": "estilo depoimento de quem já comprou e usou, tom pessoal",
};

interface RespostaTextoIA {
  gancho: string;
  textoSecundario: string;
  hashtags: string[];
}

function montarPrompt(produto: ProdutoAnuncio, estilo: AnuncioEstilo, destino: AnuncioDestino): string {
  return `Você é redator de anúncios de afiliado, escrevendo em português do Brasil.

Dados do produto:
- Nome: ${produto.title ?? "não informado"}
- Preço: ${produto.price ?? "não informado"}
- Categoria: ${produto.category ?? "não informada"}
- Benefício principal: ${produto.benefit ?? "não informado"}
- Nota: ${produto.rating ?? "não informada"}
- Estilo pedido: ${DESCRICAO_ESTILO[estilo]}
- Vai ser publicado em: ${destino === "pinterest" ? "Pinterest" : "Shopee Video"}

Gere:
- "gancho": frase curta e chamativa pra capa do anúncio, até 60 caracteres.
- "textoSecundario": complemento curto do gancho, até 60 caracteres.
- "hashtags": lista de até 10 hashtags em português, cada uma começando com # e sem espaço, incluindo pelo menos 2 tiradas do nome do produto.

Responda SOMENTE em JSON válido, sem markdown, neste formato exato:
{"gancho": "...", "textoSecundario": "...", "hashtags": ["...", "..."]}`;
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { produto, estilo, destino } = await request.json();
  if (!produto || !estilo || !destino) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  try {
    const json = await chamarGeminiJSON<RespostaTextoIA>(montarPrompt(produto, estilo, destino));
    if (!json.gancho || !json.textoSecundario || !Array.isArray(json.hashtags)) {
      throw new IAIndisponivelError("Formato inesperado da IA.");
    }
    return NextResponse.json({
      fonte: "ia",
      gancho: String(json.gancho),
      textoSecundario: String(json.textoSecundario),
      hashtags: json.hashtags.map(String).slice(0, 15),
    });
  } catch (err) {
    // Mesmo sendo uma falha "esperada" (sem chave, limite do dia, formato
    // estranho), loga o motivo — sem isso não dá pra saber, só olhando o
    // log, por que caiu pro template.
    const motivo = err instanceof Error ? err.message : String(err);
    if (err instanceof IAIndisponivelError) {
      console.warn("[anuncios] IA de texto indisponível:", motivo);
    } else {
      console.error("[anuncios] erro inesperado ao chamar IA de texto", err);
    }
    const sugestao = gerarSugestaoTexto(produto, estilo, destino);
    return NextResponse.json({
      fonte: "template",
      motivo,
      gancho: sugestao.gancho,
      textoSecundario: sugestao.textoSecundario,
      hashtags: sugestao.hashtags,
    });
  }
}
