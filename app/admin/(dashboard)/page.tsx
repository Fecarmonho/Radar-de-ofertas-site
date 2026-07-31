import Link from "next/link";
import { getAllProducts } from "@/lib/products-db";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const products = await getAllProducts();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="btn-fire rounded-full px-5 py-2.5 text-center text-sm font-bold text-white"
        >
          + Adicionar produto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-ink/50">
          Nenhum produto ainda. Clique em "Adicionar produto" pra começar.
        </p>
      ) : (
        <>
          {/* Celular: lista de cartões */}
          <div className="flex flex-col gap-3 sm:hidden">
            {products.map((product) => (
              <div
                key={product.slug}
                className="rounded-2xl border border-ink/8 bg-white p-4 shadow-card"
              >
                <p className="font-medium text-ink">{product.title}</p>
                <p className="mt-1 text-sm text-ink/50">
                  {product.category} · {product.price}
                </p>
                <div className="mt-3 flex items-center gap-4 border-t border-ink/5 pt-3">
                  <Link
                    href={`/admin/produtos/${product.slug}`}
                    className="text-sm font-semibold text-signal"
                  >
                    Editar
                  </Link>
                  <DeleteProductButton slug={product.slug} title={product.title} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabela */}
          <div className="hidden overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-card sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/8 bg-paper text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.slug} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{product.title}</td>
                    <td className="px-4 py-3 text-ink/60">{product.category}</td>
                    <td className="px-4 py-3 text-ink/60">{product.price}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/admin/produtos/${product.slug}`}
                          className="font-semibold text-signal hover:underline"
                        >
                          Editar
                        </Link>
                        <DeleteProductButton slug={product.slug} title={product.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
