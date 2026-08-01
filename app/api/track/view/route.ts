import { NextRequest, NextResponse } from "next/server";
import { recordPageView } from "@/lib/stats-db";

/**
 * Recebe o "oi, alguém abriu esta página" mandado pelo componente
 * PageViewTracker. É de propósito uma rota do próprio domínio: bloqueador
 * de anúncio derruba chamada para google-analytics.com, mas não derruba
 * uma chamada para o seu próprio site.
 */

export const dynamic = "force-dynamic";

const BOT = /bot|crawler|spider|slurp|facebookexternalhit|headless|lighthouse|monitor|preview/i;

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  const host = request.headers.get("host") ?? "";
  const origin = request.headers.get("origin");

  // Robô não é visita.
  if (BOT.test(userAgent)) return NextResponse.json({ ok: true });

  // Só conta chamada feita pelo próprio site.
  if (origin && !sameHost(origin, host)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path : "";

  // O painel não entra na contagem de visitas do site.
  if (!path.startsWith("/") || path.startsWith("/admin")) {
    return NextResponse.json({ ok: true });
  }

  try {
    await recordPageView({
      path: path.slice(0, 80),
      source: sourceOf(body?.campaign, body?.referrer, host),
    });
  } catch (err) {
    // Medição nunca pode quebrar a navegação de quem está no site.
    console.error("[track] falha ao registrar visita", err);
  }

  return NextResponse.json({ ok: true });
}

function sameHost(origin: string, host: string): boolean {
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * De onde veio a visita: primeiro o parâmetro de campanha (utm_campaign,
 * utm_source ou src, que é o que você coloca no anúncio), senão o site
 * que linkou, senão "direto".
 */
function sourceOf(campaign: unknown, referrer: unknown, host: string): string {
  if (typeof campaign === "string" && campaign.trim()) {
    return campaign.trim().slice(0, 40);
  }
  if (typeof referrer !== "string" || !referrer) return "direto";

  try {
    const refHost = new URL(referrer).host;
    if (!refHost || refHost === host) return "interno";
    return refHost.replace(/^www\./, "");
  } catch {
    return "direto";
  }
}
