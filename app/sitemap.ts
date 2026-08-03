import { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products-db";
import { getAllSections } from "@/lib/sections-db";
import { SITE_URL } from "@/lib/site-url";

/**
 * Lista de endereços para o Google. Num site de oferta isso pesa: sem
 * sitemap, um produto novo pode levar semanas para ser descoberto — e
 * oferta que demora a aparecer já morreu.
 *
 * Regerado junto com o resto do site (as páginas revalidam a cada 60s).
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [produtos, secoes] = await Promise.all([getAllProducts(), getAllSections()]);
  const agora = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: agora,
      changeFrequency: "daily",
      priority: 1,
    },
    ...secoes.map((secao) => ({
      url: `${SITE_URL}/secoes/${secao.slug}`,
      lastModified: agora,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...produtos.map((produto) => ({
      url: `${SITE_URL}/produtos/${produto.slug}`,
      // O preço é conferido todo dia; quando muda, a data avisa o Google.
      lastModified: produto.priceUpdatedAt ? new Date(produto.priceUpdatedAt) : agora,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
