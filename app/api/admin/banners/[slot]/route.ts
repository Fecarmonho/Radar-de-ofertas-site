import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { saveBanner, deleteBanner, isBannerSlot } from "@/lib/banners-db";

/** Um documento do Firestore não passa de 1MB — a foto tem que caber nele. */
const TAMANHO_MAXIMO = 900_000;

export async function PUT(
  request: NextRequest,
  { params }: { params: { slot: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!isBannerSlot(params.slot)) {
    return NextResponse.json({ error: "Espaço inválido." }, { status: 400 });
  }

  const { image, link, alt } = await request.json();

  if (typeof image !== "string" || !image) {
    return NextResponse.json({ error: "Envie uma foto." }, { status: 400 });
  }

  if (!image.startsWith("data:image/") && !image.startsWith("https://")) {
    return NextResponse.json(
      { error: "Formato de imagem não aceito." },
      { status: 400 }
    );
  }

  if (image.length > TAMANHO_MAXIMO) {
    return NextResponse.json(
      { error: "Essa foto ficou grande demais mesmo depois de comprimida. Tente uma menor." },
      { status: 400 }
    );
  }

  if (link && !linkValido(link)) {
    return NextResponse.json(
      { error: "O link precisa começar com https:// ou com / (uma página do próprio site)." },
      { status: 400 }
    );
  }

  await saveBanner(Number(params.slot) as 1 | 2, { image, link, alt });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slot: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!isBannerSlot(params.slot)) {
    return NextResponse.json({ error: "Espaço inválido." }, { status: 400 });
  }

  await deleteBanner(Number(params.slot) as 1 | 2);
  return NextResponse.json({ ok: true });
}

/**
 * Aceita endereço externo em https ou caminho interno ("/produtos/x").
 * Barra javascript:, data: e afins, que virariam brecha de segurança numa
 * faixa clicável da home.
 */
function linkValido(link: unknown): boolean {
  if (typeof link !== "string" || !link.trim()) return true;
  const valor = link.trim();
  if (valor.startsWith("/")) return true;
  try {
    return new URL(valor).protocol === "https:";
  } catch {
    return false;
  }
}
