import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { updateSection, deleteSection } from "@/lib/sections-db";
import { Section } from "@/lib/affiliates";

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const section = (await request.json()) as Section;

  if (!section.slug || !section.name) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  try {
    await updateSection(params.slug, section);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar seção." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  await deleteSection(params.slug);
  return NextResponse.json({ ok: true });
}
