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
  /** Tags para SEO / schema.org */
  brand?: string;
  rating?: number;
  reviewCount?: number;
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

/** URL interna que o botão de compra deve usar — nunca o link de afiliado direto. */
export function buildTrackedGoUrl(slug: string, source?: string): string {
  const params = source ? `?src=${encodeURIComponent(source)}` : "";
  return `/api/go/${slug}${params}`;
}
