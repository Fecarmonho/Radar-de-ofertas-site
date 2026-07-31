import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products-db";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">
        Editar produto
      </h1>
      <ProductForm initialProduct={product} />
    </div>
  );
}
