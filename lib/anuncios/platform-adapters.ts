import "server-only";

import { scrapeShopeeProduct, explicarDiagnostico } from "@/lib/scrape-shopee";
import { AnuncioOrigem, ProdutoAnuncio } from "./types";

/**
 * Cada rede tem seu jeito de publicar (ou não) os dados do produto — hoje
 * só a Shopee tem um leitor de verdade (lib/scrape-shopee.ts). Amazon e
 * Pinterest entram aqui como pontos de extensão: quando alguém tiver um
 * link de exemplo de cada uma para testar, o leitor entra neste arquivo
 * sem mexer no resto da área de anúncios.
 */
export type ResolverProdutoResultado =
  | { ok: true; produto: ProdutoAnuncio }
  | { ok: false; suportado: false; aviso: string }
  | { ok: false; suportado: true; error: string };

const NOMES_ORIGEM: Record<AnuncioOrigem, string> = {
  shopee: "Shopee",
  amazon: "Amazon",
  pinterest: "Pinterest",
};

const IMAGEM_TIMEOUT_MS = 8_000;
/** Generoso o bastante para uma foto de produto, curto o bastante para não travar a rota. */
const IMAGEM_MAX_BYTES = 6 * 1024 * 1024;

/**
 * Baixa a foto do produto no servidor e devolve como data URL em base64.
 *
 * A foto que a Shopee publica é uma URL de CDN de terceiro. Desenhar uma
 * imagem remota sem CORS num <canvas> deixa o canvas "sujo": toBlob/
 * toDataURL passam a falhar na hora de exportar a capa. Buscando a foto
 * aqui no servidor e devolvendo em base64, ela chega ao navegador como
 * same-origin e o Canvas consegue exportar sem problema — mesmo princípio
 * já usado em lib/image-compress.ts para fotos enviadas à mão.
 */
async function baixarImagemComoBase64(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(IMAGEM_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return undefined;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return undefined;

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > IMAGEM_MAX_BYTES) return undefined;

    return `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    // Se a foto não vier, a busca de dados continua — a pessoa pode subir
    // uma foto na mão, como já acontece hoje no cadastro de produto.
    return undefined;
  }
}

async function resolverShopee(url: string): Promise<ResolverProdutoResultado> {
  const dados = await scrapeShopeeProduct(url);

  if (!dados.title && !dados.image) {
    return { ok: false, suportado: true, error: explicarDiagnostico(dados.diagnostico) };
  }

  const image = dados.image ? await baixarImagemComoBase64(dados.image) : undefined;

  const produto: ProdutoAnuncio = {
    title: dados.title,
    image,
    price: dados.price,
    priceValue: dados.priceValue,
    rating: dados.rating,
    reviewCount: dados.reviewCount,
    sourceUrl: dados.canonicalUrl ?? url,
    origem: "shopee",
  };

  return { ok: true, produto };
}

function resolverNaoSuportado(origem: AnuncioOrigem): ResolverProdutoResultado {
  return {
    ok: false,
    suportado: false,
    aviso: `Busca automática para ${NOMES_ORIGEM[origem]} ainda não está disponível. Preencha os dados do produto manualmente.`,
  };
}

export async function resolverProdutoPorLink(
  origem: AnuncioOrigem,
  url: string
): Promise<ResolverProdutoResultado> {
  if (origem === "shopee") return resolverShopee(url);
  return resolverNaoSuportado(origem);
}
