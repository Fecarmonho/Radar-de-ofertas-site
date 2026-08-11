import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { chamarGeminiJSON, IAIndisponivelError } from "@/lib/anuncios/ai";
import { gerarPromptImagem, gerarPromptVideo } from "@/lib/anuncios/templates";
import { AnuncioDestino, AnuncioEstilo, ProdutoAnuncio } from "@/lib/anuncios/types";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

const DESCRICAO_ESTILO: Record<AnuncioEstilo, string> = {
  clean: "clean, direto ao ponto, sem exagero",
  "gancho-forte": "gancho forte, senso de urgência, bem chamativo",
  beneficio: "focado no benefício principal do produto pro dia a dia de quem compra",
  "ugc-review": "estilo depoimento de quem já comprou e usou, tom pessoal",
};

interface RespostaPromptsIA {
  promptImagem: string;
  promptVideo: string;
}

function montarPrompt(
  produto: ProdutoAnuncio,
  estilo: AnuncioEstilo,
  destino: AnuncioDestino,
  modelo: string
): string {
  return `Você ajuda a escrever, em português do Brasil, prompts prontos pra colar em OUTRAS ferramentas de IA — não gere nada você mesmo, só escreva os prompts.

Dados do produto:
- Nome: ${produto.title ?? "não informado"}
- Preço: ${produto.price ?? "não informado"}
- Categoria: ${produto.category ?? "não informada"}
- Estilo pedido: ${DESCRICAO_ESTILO[estilo]}
- Vai ser publicado em: ${destino === "pinterest" ? "Pinterest" : "Shopee Video"}
- Modelo/pessoa a incluir na imagem/vídeo: ${modelo.trim() || "nenhum especificado — use seu critério, ou nenhum se o estilo for clean/still de produto"}

Gere:
- "promptImagem": um prompt pra uma IA de edição de imagem (tipo GPT-4o/DALL-E) melhorar a foto do produto e, se fizer sentido pro estilo, incluir o modelo descrito usando o produto. Precisa deixar claro pra manter o produto real e reconhecível (não mudar cor, formato, texto ou marca). Terminar pedindo proporção vertical 9:16.
- "promptVideo": um prompt pra uma IA de geração de vídeo (tipo Veo/Gemini) criar um vídeo vertical 9:16 de 8 a 15 segundos anunciando o produto, no estilo pedido.

Responda SOMENTE em JSON válido, sem markdown, neste formato exato:
{"promptImagem": "...", "promptVideo": "..."}`;
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { produto, estilo, destino, modelo } = await request.json();
  if (!produto || !estilo || !destino) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const modeloTexto = typeof modelo === "string" ? modelo : "";

  try {
    const json = await chamarGeminiJSON<RespostaPromptsIA>(
      montarPrompt(produto, estilo, destino, modeloTexto)
    );
    if (!json.promptImagem || !json.promptVideo) {
      throw new IAIndisponivelError("Formato inesperado da IA.");
    }
    return NextResponse.json({
      fonte: "ia",
      promptImagem: String(json.promptImagem),
      promptVideo: String(json.promptVideo),
    });
  } catch (err) {
    if (!(err instanceof IAIndisponivelError)) {
      console.error("[anuncios] erro inesperado ao chamar IA de prompts", err);
    }
    return NextResponse.json({
      fonte: "template",
      promptImagem: gerarPromptImagem(produto, estilo, modeloTexto),
      promptVideo: gerarPromptVideo(produto, estilo, destino, modeloTexto),
    });
  }
}
