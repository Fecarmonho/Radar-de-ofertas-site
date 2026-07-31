import ProductForm from "@/components/admin/ProductForm";
import { getAllSections } from "@/lib/sections-db";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const sections = await getAllSections();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">
        Adicionar produto
      </h1>
      <ProductForm sections={sections} />
    </div>
  );
}
