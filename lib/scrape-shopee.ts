import "server-only";

/**
 * Leitura dos dados de um produto da Shopee a partir do link.
 *
 * Como a Shopee se comporta (medido, não chutado):
 *
 * - A página do produto é renderizada por JavaScript. Para um navegador
 *   comum ela vem praticamente vazia; para um crawler de rede social ela
 *   vem com as tags Open Graph (título, foto, descrição) e um bloco
 *   JSON-LD com preço, nota e número de avaliações. Por isso usamos o
 *   User-Agent do crawler do Facebook na hora de ler a página.
 *
 * - Os links curtos de afiliado (s.shopee.com.br, shope.ee) fazem o
 *   contrário: respondem 403 para o crawler e só redirecionam para um
 *   User-Agent de navegador. Então o caminho é: resolver o link curto
 *   como navegador, e só depois ler a página final como crawler.
 */

const UA_CRAWLER =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
const UA_BROWSER =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/**
 * Curto de propósito: a rota tem tempo limitado na Vercel e faz até três
 * requisições em sequência. Melhor desistir de uma que travou do que
 * derrubar a chamada inteira por estouro de tempo.
 */
const TIMEOUT_MS = 7_000;

export interface ScrapedProduct {
  title?: string;
  image?: string;
  description?: string;
  /** Preço já formatado para exibição, ex: "R$ 346,50" */
  price?: string;
  /** Mesmo preço como número, para comparar variações entre atualizações */
  priceValue?: number;
  rating?: number;
  reviewCount?: number;
  /** Endereço final da página do produto (o link curto já resolvido) */
  canonicalUrl?: string;
  /**
   * O que aconteceu na conversa com a Shopee. Serve para a mensagem de
   * erro dizer se ela bloqueou, se demorou, ou se respondeu sem os dados
   * — sem isso, qualquer falha vira o mesmo "não consegui ler o link".
   */
  diagnostico?: Diagnostico;
}

export interface Diagnostico {
  urlResolvida: string;
  /** Último código HTTP que a Shopee devolveu (0 = nem respondeu) */
  status: number;
  /** true quando o link curto não chegou a virar página de produto */
  naoResolveu: boolean;
  /** true quando alguma requisição estourou o tempo */
  demorou: boolean;
}

// `demorou` existe nos dois casos de propósito: assim quem lê o
// resultado não depende de estreitamento de tipo para consultá-lo.
type ResultadoFetch =
  | { ok: true; url: string; html: string; status: number; demorou: false }
  | { ok: false; status: number; demorou: boolean };

async function fetchPage(url: string, userAgent: string): Promise<ResultadoFetch> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": userAgent, Accept: "text/html" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    return {
      ok: true,
      url: response.url,
      html: await response.text(),
      status: response.status,
      demorou: false,
    };
  } catch (err) {
    // Estouro de tempo e recusa de conexão precisam ser distinguidos:
    // um vira "a Shopee demorou", o outro "a Shopee bloqueou".
    const nome = err instanceof Error ? err.name : "";
    return { ok: false, status: 0, demorou: nome === "TimeoutError" || nome === "AbortError" };
  }
}

/**
 * Tira o par (loja, item) de qualquer formato de URL de produto da Shopee.
 *
 * São três formatos em uso, e o terceiro é justamente para onde os links
 * curtos de afiliado redirecionam hoje:
 *
 *   /Nome-Do-Produto-i.1367299138.22893392542
 *   /product/1367299138/22893392542
 *   /nomedaloja/1367299138/22893392542?__mobile__=1
 */
export function parseShopeeIds(url: string): { shopId: string; itemId: string } | null {
  const patterns = [
    /-i\.(\d+)\.(\d+)/,
    /\/product\/(\d+)\/(\d+)/,
    // Qualquer /alguma-coisa/<numero longo>/<numero longo> — os ids da
    // Shopee têm muitos dígitos, o que evita casar com paginação e afins.
    /\/[^/?#]+\/(\d{6,})\/(\d{6,})(?:[/?#]|$)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return { shopId: match[1], itemId: match[2] };
  }
  return null;
}

/**
 * Segue um link curto de afiliado até a página real do produto.
 * Devolve a própria URL se ela já for uma página de produto.
 */
export async function resolveShopeeUrl(
  url: string
): Promise<{ url: string; status: number; demorou: boolean }> {
  let current = url;
  let status = 0;
  let demorou = false;

  for (let hop = 0; hop < 3; hop++) {
    if (parseShopeeIds(current)) return { url: current, status, demorou };

    const page = await fetchPage(current, UA_BROWSER);
    if (!page.ok) {
      demorou = demorou || page.demorou;
      break;
    }
    status = page.status;

    // Redirecionamento HTTP normal já resolvido pelo fetch
    if (parseShopeeIds(page.url)) return { url: page.url, status, demorou };

    const next = findRedirect(page.html, page.url);
    if (!next || next === current) {
      current = page.url;
      break;
    }
    current = next;
  }

  return { url: current, status, demorou };
}

/**
 * Acha para onde a página intermediária quer mandar o visitante:
 * <meta refresh>, redirecionamento por JavaScript, link canônico, ou
 * qualquer endereço de produto da Shopee solto no HTML.
 */
function findRedirect(html: string, baseUrl: string): string | undefined {
  const patterns = [
    /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"'>]+)["']/i,
    /location\.(?:href|replace)\s*\(?\s*=?\s*["']([^"']+)["']/i,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    /["'](?:redirectUrl|deeplink|targetUrl)["']\s*:\s*["']([^"']+)["']/i,
    /(https?:\/\/[^\s"'<>]*shopee\.com\.br\/[^\s"'<>]*-i\.\d+\.\d+[^\s"'<>]*)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        return new URL(match[1].replace(/\\u002F/gi, "/").replace(/\\\//g, "/"), baseUrl).toString();
      } catch {
        // endereço inválido, tenta o próximo padrão
      }
    }
  }
  return undefined;
}

/** Lê o bloco JSON-LD do tipo Product que a Shopee embute na página. */
function extractProductJsonLd(html: string): Record<string, any> | null {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const block of blocks) {
    try {
      const data = JSON.parse(block[1]);
      const nodes = Array.isArray(data) ? data : [data];
      const product = nodes.find((node) => node?.["@type"] === "Product");
      if (product) return product;
    } catch {
      // bloco malformado, tenta o próximo
    }
  }
  return null;
}

/** Os campos que dá para tirar de uma página, antes de formatar. */
interface DadosParciais {
  title?: string;
  image?: string;
  description?: string;
  priceValue?: number;
  rating?: number;
  reviewCount?: number;
}

export async function scrapeShopeeProduct(url: string): Promise<ScrapedProduct> {
  const resolvido = await resolveShopeeUrl(url);
  const ids = parseShopeeIds(resolvido.url);

  const diagnostico: Diagnostico = {
    urlResolvida: resolvido.url,
    status: resolvido.status,
    naoResolveu: !ids,
    demorou: resolvido.demorou,
  };

  // A Shopee é irregular: às vezes o endereço com os parâmetros de
  // rastreio traz as tags Open Graph e nenhum dado estruturado, às vezes
  // o endereço canônico traz o contrário. Então tentamos os dois e
  // juntamos o que cada um deu, em vez de apostar num só.
  const tentativas = [resolvido.url];
  if (ids) {
    const canonica = `https://shopee.com.br/product/${ids.shopId}/${ids.itemId}`;
    if (canonica !== resolvido.url) tentativas.push(canonica);
  }

  let dados: DadosParciais = {};
  for (const alvo of tentativas) {
    dados = mesclar(dados, await lerPagina(alvo, diagnostico));
    if (dados.title && dados.image && dados.priceValue !== undefined) break;
  }

  if (!dados.title) dados.title = titleFromUrl(resolvido.url);

  return {
    ...dados,
    price: dados.priceValue !== undefined ? formatBRL(dados.priceValue) : undefined,
    canonicalUrl: resolvido.url,
    diagnostico,
  };
}

/** Baixa uma página e tira dela tudo que der, anotando o que aconteceu. */
async function lerPagina(url: string, diagnostico: Diagnostico): Promise<DadosParciais> {
  const page = await fetchPage(url, UA_CRAWLER);

  if (!page.ok) {
    diagnostico.demorou = diagnostico.demorou || page.demorou;
    return {};
  }

  diagnostico.status = page.status;
  if (page.status !== 200) return {};

  const jsonLd = extractProductJsonLd(page.html);
  const rating = readRating(jsonLd);

  return {
    title: readTitle(page.html, jsonLd),
    image: matchMetaContent(page.html, "og:image") ?? firstImage(jsonLd),
    description: readDescription(page.html, jsonLd),
    priceValue: readPrice(jsonLd, page.html),
    rating: rating?.value,
    reviewCount: rating?.count,
  };
}

/** O primeiro que tiver o campo preenchido ganha. */
function mesclar(a: DadosParciais, b: DadosParciais): DadosParciais {
  return {
    title: a.title ?? b.title,
    image: a.image ?? b.image,
    description: a.description ?? b.description,
    priceValue: a.priceValue ?? b.priceValue,
    rating: a.rating ?? b.rating,
    reviewCount: a.reviewCount ?? b.reviewCount,
  };
}

/**
 * Busca só o preço atual — usado pela atualização automática diária.
 *
 * Aqui aceitamos apenas o preço do JSON-LD, nunca o "R$ 99,90" achado
 * solto no HTML: ninguém está olhando quando isso roda, e é melhor
 * manter o preço antigo do que publicar sozinho um valor que pode ter
 * vindo de um produto sugerido na lateral da página.
 */
export async function fetchShopeePrice(url: string): Promise<number | undefined> {
  const resolvido = await resolveShopeeUrl(url);
  const ids = parseShopeeIds(resolvido.url);

  const tentativas = ids
    ? [`https://shopee.com.br/product/${ids.shopId}/${ids.itemId}`, resolvido.url]
    : [resolvido.url];

  for (const alvo of tentativas) {
    const page = await fetchPage(alvo, UA_CRAWLER);
    if (!page.ok || page.status !== 200) continue;

    const price = readPrice(extractProductJsonLd(page.html), "");
    if (price !== undefined) return price;
  }

  return undefined;
}

function readTitle(html: string, jsonLd: Record<string, any> | null): string | undefined {
  const raw = matchMetaContent(html, "og:title") ?? asString(jsonLd?.name);
  if (!raw) return undefined;

  // "Nome do produto | Shopee Brasil" -> "Nome do produto"
  const clean = raw.replace(/\s*\|\s*Shopee\s*Brasil\s*$/i, "").trim();

  // Quando o link não resolve para um produto, a Shopee devolve uma página
  // genérica ("Shopee Brasil | Ofertas incríveis..."). Isso não é título.
  if (!clean || /^shopee\s*brasil/i.test(clean)) return undefined;

  return clean;
}

function readDescription(
  html: string,
  jsonLd: Record<string, any> | null
): string | undefined {
  const raw = matchMetaContent(html, "og:description") ?? asString(jsonLd?.description);
  if (!raw) return undefined;

  // A descrição vem com um prefixo de marketing da própria Shopee.
  return raw
    .replace(/^Compre\s.*?\sna Shopee Brasil!\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

function readPrice(
  jsonLd: Record<string, any> | null,
  html: string
): number | undefined {
  const offers = jsonLd?.offers;
  const offer = Array.isArray(offers) ? offers[0] : offers;
  const fromJsonLd = toNumber(offer?.price ?? offer?.lowPrice);
  if (fromJsonLd !== undefined) return fromJsonLd;

  // Sem JSON-LD: procura um "R$ 99,90" solto. É menos confiável (pode
  // pegar o preço riscado ou o de outro produto sugerido na página), por
  // isso só entra como último recurso.
  const loose = html.match(/R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/);
  if (!loose) return undefined;
  return toNumber(loose[1].replace(/\./g, "").replace(",", "."));
}

function readRating(
  jsonLd: Record<string, any> | null
): { value: number; count?: number } | undefined {
  const aggregate = jsonLd?.aggregateRating;
  const value = toNumber(aggregate?.ratingValue);
  if (value === undefined || value <= 0) return undefined;

  const count = toNumber(aggregate?.ratingCount ?? aggregate?.reviewCount);
  return {
    value: Math.round(value * 10) / 10,
    count: count && count > 0 ? Math.round(count) : undefined,
  };
}

function firstImage(jsonLd: Record<string, any> | null): string | undefined {
  const image = jsonLd?.image;
  if (Array.isArray(image)) return asString(image[0]);
  return asString(image) ?? asString(image?.url);
}

/**
 * Última tentativa de título: a URL da Shopee carrega o nome no formato
 * "Nome-Do-Produto-i.123.456".
 */
function titleFromUrl(url: string): string | undefined {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    const slug = path.split("/").filter(Boolean).pop();
    if (!slug) return undefined;
    const withoutId = slug.replace(/-i\.\d+\.\d+$/i, "");
    if (!withoutId || withoutId === slug) return undefined;
    return withoutId.replace(/-/g, " ").trim();
  } catch {
    return undefined;
  }
}

function matchMetaContent(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return undefined;
}

export function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d)(?=,))/g, ".")}`;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const parsed = Number(value.replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}
