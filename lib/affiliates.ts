/**
 * Camada de abstração da rede de afiliados.
 *
 * Este arquivo centraliza a lógica de montagem do link de afiliado
 * para que o resto do app (páginas, componentes) nunca precise saber
 * detalhes da rede — só chama buildAffiliateUrl(product).
 *
 * IMPORTANTE sobre Google Ads:
 * A Shopee NÃO permite usar o link de afiliado como URL final do
 * anúncio. O anúncio deve apontar para uma página sua (esta landing
 * page), e o clique no botão de compra é que leva ao link de afiliado,
 * via /api/go/[slug] — que registra o clique antes de redirecionar.
 * Isso também facilita medir conversão por origem de tráfego
 * (orgânico vs. pago).
 */

export type Network = "shopee";

export interface Product {
  slug: string;
  title: string;
  shortDescription: string;
  image: string;
  /** Preço formatado para exibição, ex: "R$ 129,90" */
  price: string;
  /** O mesmo preço como número — usado para comparar entre atualizações */
  priceValue?: number;
  /** Quando o preço foi conferido na Shopee pela última vez (ISO) */
  priceUpdatedAt?: string;
  /** Se false, a atualização automática diária não mexe nesse preço */
  priceAutoUpdate?: boolean;
  category: string;
  network: Network;
  /** ID/URL do produto na rede de origem, sem os parâmetros de afiliado */
  networkProductId: string;
  /** Slug da seção (ex: "fones-de-ouvido") em que o produto aparece na home. */
  sectionSlug?: string;
  /** Tags para SEO / schema.org */
  brand?: string;
  rating?: number;
  reviewCount?: number;
}

/** Seção editorial da home (ex: "Fones de ouvido", "Casa"), criada pelo admin. */
export interface Section {
  slug: string;
  name: string;
  /** Define a ordem de exibição na home — menor aparece primeiro. */
  order: number;
}

interface NetworkConfig {
  label: string;
  /** Monta a URL final de afiliado a partir do ID do produto */
  buildUrl: (productId: string) => string;
  /** Cookie window em dias, só para exibir/documentar no painel interno */
  cookieDays: number;
}

// Tags de afiliado — troque pelos seus IDs reais.
// Em produção, prefira ler de variáveis de ambiente (veja .env.example).
const AFFILIATE_IDS = {
  shopee: process.env.NEXT_PUBLIC_SHOPEE_AFFILIATE_ID ?? "SEU_ID_SHOPEE",
};

export const NETWORKS: Record<Network, NetworkConfig> = {
  shopee: {
    label: "Shopee",
    cookieDays: 7,
    buildUrl: (productId) => {
      // productId aqui é o link curto de afiliado que a própria Shopee
      // gera no painel de afiliados (affiliate.shopee.com.br) — a Shopee
      // não permite montar o link manualmente via query params, então
      // normalmente você cola o link gerado no painel.
      return productId;
    },
  },
};

export function buildAffiliateUrl(product: Pick<Product, "network" | "networkProductId">): string {
  return NETWORKS[product.network].buildUrl(product.networkProductId);
}

/**
 * Domínios para os quais o botão de compra pode mandar o visitante.
 * Inclui os encurtadores que o painel de afiliados da Shopee gera.
 */
const ALLOWED_AFFILIATE_HOSTS = [
  "shopee.com.br",
  "shopee.com",
  "shope.ee",
  "shp.ee",
];

/**
 * O link de afiliado é digitado no painel e guardado no banco — o
 * /api/go redireciona pra ele. Sem essa checagem, um link errado (ou um
 * painel comprometido) transformaria o site num redirecionador aberto,
 * que é motivo de suspensão no Google Ads e de alerta de phishing.
 */
export function isAllowedAffiliateUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return false;
    return ALLOWED_AFFILIATE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

/**
 * Lê "R$ 1.299,90" (ou "1299.90", ou "1.299,90") como número.
 * Serve para guardar o preço digitado à mão também como valor numérico,
 * que é o que a atualização automática compara.
 */
export function parsePriceBRL(text: string): number | undefined {
  if (!text) return undefined;

  let digits = text.replace(/[^\d.,]/g, "");
  if (!digits) return undefined;

  // Formato brasileiro: ponto é separador de milhar, vírgula é decimal.
  if (digits.includes(",")) {
    digits = digits.replace(/\./g, "").replace(",", ".");
  }

  const value = Number(digits);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Diz se o preço foi escrito como faixa ("R$ 16,99 - R$ 48,99"), o que
 * acontece quando o produto tem variações.
 *
 * A Shopee não publica os dois extremos em lugar nenhum que dê para ler
 * de fora — a página estruturada traz um valor só, o da variação mais
 * barata. Então uma faixa é sempre algo que a pessoa digitou à mão, e a
 * atualização automática não deve encostar nela.
 */
export function isPriceRange(text: string): boolean {
  if (!text) return false;
  // Sem \b depois de "até": o acento não conta como caractere de palavra
  // em JavaScript, então a borda nunca casaria ali.
  return /\d[\d.,]*\s*(?:[-–—]|\bat[ée]|\ba\b)\s*R?\$?\s*\d/i.test(text.trim());
}

/** URL interna que o botão de compra deve usar — nunca o link de afiliado direto. */
export function buildTrackedGoUrl(slug: string, source?: string): string {
  const params = source ? `?src=${encodeURIComponent(source)}` : "";
  return `/api/go/${slug}${params}`;
}
