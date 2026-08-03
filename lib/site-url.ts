/**
 * Endereço público do site — usado em tudo que precisa de URL absoluta:
 * imagem de preview de link (WhatsApp/Facebook), sitemap, canônica e
 * schema.org. URL relativa não serve nesses lugares.
 *
 * Ordem de preferência:
 *  1. NEXT_PUBLIC_SITE_URL — defina assim que o domínio próprio existir
 *  2. o endereço que a própria Vercel injeta no deploy
 *  3. localhost, para desenvolvimento
 */
const FALLBACK = "http://localhost:3000";

function normalizar(url: string): string {
  const comProtocolo = url.startsWith("http") ? url : `https://${url}`;
  return comProtocolo.replace(/\/+$/, "");
}

export const SITE_URL = normalizar(
  process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    FALLBACK
);

/**
 * Monta uma URL absoluta a partir de um caminho interno ("/produtos/x").
 * O que já vier absoluto (foto hospedada na Shopee, por exemplo) passa
 * direto — senão viraria "https://meusite.com/https://shopee...".
 */
export function urlAbsoluta(caminho: string): string {
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${SITE_URL}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}
