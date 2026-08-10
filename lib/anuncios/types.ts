/**
 * Tipos compartilhados da área de criação de anúncios (admin > Anúncios).
 * Usado tanto no servidor (rota de API, adapters) quanto no cliente
 * (formulário, geração de capa) — por isso não tem "server-only" aqui.
 */

/** De onde veio o link do produto. */
export type AnuncioOrigem = "shopee" | "amazon" | "pinterest";

/** Onde o material gerado vai ser publicado — afeta tom de texto e hashtags. */
export type AnuncioDestino = "shopee-video" | "pinterest";

/** Estilo visual/de copy da capa e da legenda. */
export type AnuncioEstilo = "clean" | "gancho-forte" | "beneficio" | "ugc-review";

export const ORIGENS: { value: AnuncioOrigem; label: string }[] = [
  { value: "shopee", label: "Shopee" },
  { value: "amazon", label: "Amazon" },
  { value: "pinterest", label: "Pinterest" },
];

export const DESTINOS: { value: AnuncioDestino; label: string }[] = [
  { value: "shopee-video", label: "Shopee Video" },
  { value: "pinterest", label: "Pinterest" },
];

export const ESTILOS: { value: AnuncioEstilo; label: string }[] = [
  { value: "clean", label: "Clean" },
  { value: "gancho-forte", label: "Gancho forte" },
  { value: "beneficio", label: "Benefício" },
  { value: "ugc-review", label: "UGC/Review" },
];

/**
 * Dados do produto usados para montar o anúncio. `image`, quando vem de
 * busca automática, já chega como base64 (ver lib/anuncios/platform-adapters.ts)
 * para poder ser desenhada num <canvas> sem esbarrar em CORS.
 */
export interface ProdutoAnuncio {
  title?: string;
  image?: string;
  price?: string;
  priceValue?: number;
  rating?: number;
  reviewCount?: number;
  category?: string;
  /** Preenchido à mão — não vem de nenhum scraper. */
  benefit?: string;
  sourceUrl: string;
  origem: AnuncioOrigem;
}

export interface SugestaoTexto {
  gancho: string;
  textoSecundario: string;
  legenda: string;
  hashtags: string[];
}
