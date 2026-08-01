import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/products-db";
import { buildAffiliateUrl, isAllowedAffiliateUrl } from "@/lib/affiliates";
import { recordClick } from "@/lib/stats-db";

/**
 * GET /api/go/:slug?src=ads|organic|...
 *
 * 1. Encontra o produto pelo slug.
 * 2. Registra o clique (server-side — não depende de JS no navegador,
 *    então não é bloqueado por ad-blockers e não perde dado no iOS).
 * 3. Redireciona (302) para o link de afiliado real.
 *
 * A contagem vai para o documento do dia na coleção "stats" e aparece em
 * /admin/metricas; se o GA4 estiver configurado, o mesmo clique também é
 * enviado para lá, pra cruzar com as campanhas do Google Ads.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const source = request.nextUrl.searchParams.get("src") ?? "direct";
  const destination = buildAffiliateUrl(product);

  // Só redireciona pra domínio da Shopee. Se um produto antigo tiver um
  // link fora da lista, ele para aqui em vez de virar redirecionamento
  // aberto — o erro aparece nos logs da Vercel pra você corrigir o cadastro.
  if (!isAllowedAffiliateUrl(destination)) {
    console.error(
      `[go] link de afiliado recusado no produto "${product.slug}": ${destination}`
    );
    return NextResponse.redirect(new URL(`/produtos/${product.slug}`, request.url));
  }

  await logClick({
    slug: product.slug,
    network: product.network,
    source,
    userAgent: request.headers.get("user-agent") ?? "",
    referer: request.headers.get("referer") ?? "",
    timestamp: new Date().toISOString(),
  });

  return NextResponse.redirect(destination, { status: 302 });
}

interface ClickEvent {
  slug: string;
  network: string;
  source: string;
  userAgent: string;
  referer: string;
  timestamp: string;
}

async function logClick(event: ClickEvent) {
  // Contador do dia no Firestore — é o que alimenta /admin/metricas.
  try {
    await recordClick({ slug: event.slug, source: event.source });
  } catch (err) {
    // Se a contagem falhar, o visitante ainda tem que chegar na Shopee.
    console.error("[click] falha ao registrar clique", err);
  }

  // Continua no log da Vercel também, útil pra investigar caso a caso.
  console.log("[click]", JSON.stringify(event));

  const ga4Secret = process.env.GA4_API_SECRET;
  const ga4MeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  if (!ga4Secret || !ga4MeasurementId) return;

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${ga4MeasurementId}&api_secret=${ga4Secret}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: crypto.randomUUID(),
          events: [
            {
              name: "affiliate_click",
              params: {
                product_slug: event.slug,
                network: event.network,
                traffic_source: event.source,
              },
            },
          ],
        }),
      }
    );
  } catch (err) {
    console.error("Falha ao enviar evento para GA4", err);
  }
}
