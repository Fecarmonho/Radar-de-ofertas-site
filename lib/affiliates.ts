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
  price: string;
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

/** URL interna que o botão de compra deve usar — nunca o link de afiliado direto. */
export function buildTrackedGoUrl(slug: string, source?: string): string {
  const params = source ? `?src=${encodeURIComponent(source)}` : "";
  return `/api/go/${slug}${params}`;
}
