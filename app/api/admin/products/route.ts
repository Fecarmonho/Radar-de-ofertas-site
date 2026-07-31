import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { createProduct } from "@/lib/products-db";
import { Product } from "@/lib/affiliates";

export async function POST(request: NextRequest) {
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

  try {
    await createProduct({ ...product, network: "shopee" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar produto." },
      { status: 400 }
    );
  }
}
