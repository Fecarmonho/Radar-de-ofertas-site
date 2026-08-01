import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { updateProduct, deleteProduct } from "@/lib/products-db";
import { Product, isAllowedAffiliateUrl } from "@/lib/affiliates";

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const product = (await request.json()) as Product;

  if (!product.slug || !product.title || !product.networkProductId) {
    return NextResponse.json(
      { error: "Campos obrigatórios faltando." },
      { status: 400 }
    );
  }

  if (!isAllowedAffiliateUrl(product.networkProductId)) {
    return NextResponse.json(
      { error: "O link de afiliado precisa ser um endereço https da Shopee." },
      { status: 400 }
    );
  }

  try {
    await updateProduct(params.slug, { ...product, network: "shopee" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar produto." },
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

  await deleteProduct(params.slug);
  return NextResponse.json({ ok: true });
}
