import Link from "next/link";
import { getAllProducts } from "@/lib/products-db";
import RefreshPricesButton from "@/components/admin/RefreshPricesButton";
import ProductsList from "@/components/admin/ProductsList";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const products = await getAllProducts();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Produtos</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <RefreshPricesButton />
          <Link
            href="/admin/produtos/novo"
            className="btn-fire rounded-full px-5 py-2.5 text-center text-sm font-bold text-white"
          >
            + Adicionar produto
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-ink/50">
          Nenhum produto ainda. Clique em &quot;Adicionar produto&quot; pra começar.
        </p>
      ) : (
        <ProductsList products={products} />
      )}
    </div>
  );
}
