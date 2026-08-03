"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Product, isPriceRange } from "@/lib/affiliates";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Texto embaixo do preço explicando se ele se atualiza sozinho. */
function situacaoDoPreco(product: Product): string {
  if (isPriceRange(product.price)) return "faixa digitada (não atualiza sozinho)";
  if (product.priceAutoUpdate === false) return "fixo (não atualiza sozinho)";
  if (product.priceUpdatedAt) {
    return `conferido em ${new Date(product.priceUpdatedAt).toLocaleDateString("pt-BR")}`;
  }
  return "ainda não conferido";
}

export default function ProductsList({ products }: { products: Product[] }) {
  const [busca, setBusca] = useState("");
  const termo = normalizar(busca);

  const visiveis = useMemo(() => {
    if (!termo) return products;
    return products.filter((p) =>
      normalizar(`${p.title} ${p.category} ${p.slug} ${p.brand ?? ""}`).includes(termo)
    );
  }, [products, termo]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, categoria ou marca..."
          aria-label="Buscar produto"
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none sm:max-w-sm"
        />
        <span className="shrink-0 text-xs text-ink/45">
          {termo
            ? `${visiveis.length} de ${products.length}`
            : `${products.length} ${products.length === 1 ? "produto" : "produtos"}`}
        </span>
      </div>

      {visiveis.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-ink/50">
          Nenhum produto encontrado para “{busca}”.
        </p>
      ) : (
        <>
          {/* Celular: lista de cartões */}
          <div className="flex flex-col gap-3 sm:hidden">
            {visiveis.map((product) => (
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
                {visiveis.map((product) => (
                  <tr key={product.slug} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      {product.title}
                      {!product.review && (
                        <span
                          className="ml-2 rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold text-ember"
                          title="Página sem análise escrita — conteúdo próprio ajuda no Google e no Google Ads"
                        >
                          sem análise
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink/60">{product.category}</td>
                    <td className="px-4 py-3 text-ink/60">
                      {product.price}
                      <span className="mt-0.5 block text-xs text-ink/35">
                        {situacaoDoPreco(product)}
                      </span>
                    </td>
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
    </>
  );
}
