import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { refreshAllPrices } from "@/lib/price-refresh";

/**
 * Atualização automática de preços.
 *
 * Chamada de dois jeitos:
 * - pela Vercel, todo dia (veja vercel.json), com o cabeçalho
 *   `Authorization: Bearer $CRON_SECRET`;
 * - pelo botão "Atualizar preços agora" do painel, com sessão de admin.
 */

export const dynamic = "force-dynamic";
// Consultar vários produtos na Shopee leva tempo; o limite padrão de 10s
// não seria suficiente.
export const maxDuration = 60;

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  const isCron = Boolean(secret) && header === `Bearer ${secret}`;

  if (!isCron && !(await getAdminSession())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await refreshAllPrices();
  console.log("[precos] rodada concluída", JSON.stringify(result));

  return NextResponse.json(result);
}

export const GET = handle;
export const POST = handle;
