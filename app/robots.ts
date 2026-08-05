import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { getSiteStatus } from "@/lib/site-status-db";

// Lido a cada pedido (o robots.txt é pedido de vez em quando, não custa
// nada) para que o modo manutenção apareça aqui sem esperar cache.
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const status = await getSiteStatus();

  // Em manutenção todas as páginas mostram o mesmo aviso. Pedir para o
  // Google não passar agora evita que ele troque o conteúdo já indexado
  // pelo texto de manutenção — e, diferente de um "noindex", não tira
  // nada do índice: ele só volta depois.
  if (status.state === "manutencao") {
    return {
      rules: { userAgent: "*", disallow: "/" },
      host: SITE_URL,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api/go é o redirecionador de afiliado: não é página, e link de
      // afiliado rastreado pelo Google não ajuda em nada.
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
