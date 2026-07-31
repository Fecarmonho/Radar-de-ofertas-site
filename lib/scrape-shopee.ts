import "server-only";

export interface ScrapedProduct {
  title?: string;
  image?: string;
  description?: string;
  price?: string;
}

/**
 * Busca a página do produto na Shopee e lê os mesmos dados que aparecem
 * quando você cola o link no WhatsApp/Facebook (título, foto, descrição).
 * A Shopee mantém essas tags certinhas de propósito, pra prévia de link
 * funcionar bonito — é a forma mais confiável de puxar isso sem uma API
 * oficial de afiliados.
 *
 * O preço nem sempre vem nessas tags, então é "melhor esforço": quando
 * achar, preenche; quando não, a pessoa preenche na mão mesmo.
 */
export async function scrapeShopeeProduct(url: string): Promise<ScrapedProduct> {
  let currentUrl = url;
  let html = "";

  // Links curtos da Shopee (s.shopee.com.br/...) costumam abrir uma página
  // intermediária que redireciona via JavaScript (não um redirecionamento
  // HTTP de verdade), então seguimos manualmente até 3 "pulos" atrás da
  // página final do produto.
  for (let hop = 0; hop < 3; hop++) {
    const response = await fetch(currentUrl, {
      redirect: "follow",
      headers: {
        // Sites costumam renderizar as tags de prévia (Open Graph) de
        // forma mais completa pra crawlers de redes sociais — usamos
        // esse UA pra aumentar a chance de receber a página já pronta.
        "User-Agent":
          "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`A Shopee respondeu com erro (${response.status}).`);
    }

    html = await response.text();
    currentUrl = response.url; // depois de redirecionamentos HTTP normais

    const title = matchMetaContent(html, "og:title");
    const image = matchMetaContent(html, "og:image");
    if (title && image) break; // já achamos os dados, não precisa seguir

    const nextUrl = findJsRedirect(html, currentUrl);
    if (!nextUrl || nextUrl === currentUrl) break;
    currentUrl = nextUrl;
  }

  const title = matchMetaContent(html, "og:title") ?? titleFromUrl(currentUrl);

  return {
    title,
    image: matchMetaContent(html, "og:image"),
    description: matchMetaContent(html, "og:description"),
    price: extractPrice(html),
  };
}

/** Acha um redirecionamento feito por <meta refresh>, JS ou link canônico. */
function findJsRedirect(html: string, baseUrl: string): string | undefined {
  const patterns = [
    /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"'>]+)["']/i,
    /location\.(?:href|replace)\s*\(?\s*=?\s*["']([^"']+)["']/i,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        return new URL(match[1], baseUrl).toString();
      } catch {
        // ignora URL inválida e tenta o próximo padrão
      }
    }
  }
  return undefined;
}

/**
 * Última tentativa: a própria URL do produto na Shopee costuma trazer o
 * nome no formato "Nome-Do-Produto-i.123.456" — convertemos isso num
 * título legível quando as tags da página não trazem nada.
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
  // Aceita a ordem property/content trocada, como alguns sites geram.
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]);
  }
  return undefined;
}

function extractPrice(html: string): string | undefined {
  // Tenta primeiro dados estruturados (JSON-LD), que costumam ter o preço
  // como número puro; senão cai pra procurar um "R$ 99,90" solto no HTML.
  const jsonLdMatch = html.match(
    /"price"\s*:\s*"?(\d+(?:[.,]\d{1,2})?)"?/i
  );
  if (jsonLdMatch) {
    const value = Number(jsonLdMatch[1].replace(",", "."));
    if (!Number.isNaN(value)) {
      return `R$ ${value.toFixed(2).replace(".", ",")}`;
    }
  }

  const looseMatch = html.match(/R\$\s?\d{1,3}(?:\.\d{3})*,\d{2}/);
  return looseMatch?.[0];
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
