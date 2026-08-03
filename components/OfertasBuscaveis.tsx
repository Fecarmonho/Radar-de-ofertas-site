"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProdutoDoCard } from "@/lib/affiliates";
import ProductCard from "@/components/ProductCard";

export interface Fileira {
  title: string;
  /** Slug da seção — quando existe, o título vira link para a página dela. */
  slug?: string;
  products: ProdutoDoCard[];
}

/** Tira acento e caixa, para "fone" achar "Fone de Ouvido" e "Cabeção". */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function OfertasBuscaveis({ fileiras }: { fileiras: Fileira[] }) {
  const [busca, setBusca] = useState("");

  const termo = normalizar(busca);

  // A busca roda no próprio navegador: os produtos já vieram todos com a
  // página, então filtrar aqui é instantâneo e não gera nova requisição.
  const encontrados = useMemo(() => {
    if (!termo) return [];
    const vistos = new Set<string>();
    const resultado: ProdutoDoCard[] = [];
    for (const fileira of fileiras) {
      for (const produto of fileira.products) {
        if (vistos.has(produto.slug)) continue;
        const alvo = normalizar(
          `${produto.title} ${produto.shortDescription} ${produto.category} ${produto.brand ?? ""}`
        );
        if (alvo.includes(termo)) {
          vistos.add(produto.slug);
          resultado.push(produto);
        }
      }
    }
    return resultado;
  }, [fileiras, termo]);

  return (
    <div id="ofertas" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-signal">
            Detectadas agora
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
            Ofertas no radar
          </h2>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar oferta..."
            aria-label="Buscar oferta"
            className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-9 pr-4 text-sm text-ink shadow-card outline-none transition-colors placeholder:text-ink/35 focus:border-signal"
          />
        </div>
      </div>

      {termo ? (
        encontrados.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-sm text-ink/50">
            Nenhuma oferta encontrada para “{busca}”. Tente outra palavra — ou
            volte depois, o radar não desliga.
          </p>
        ) : (
          <>
            <p className="mb-5 text-sm text-ink/50">
              {encontrados.length}{" "}
              {encontrados.length === 1 ? "oferta encontrada" : "ofertas encontradas"}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {encontrados.map((produto) => (
                <ProductCard key={produto.slug} product={produto} />
              ))}
            </div>
          </>
        )
      ) : fileiras.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-sm text-ink/50">
          Nenhuma oferta cadastrada ainda.
        </p>
      ) : (
        fileiras.map((fileira, i) => (
          <section key={fileira.title} className={i > 0 ? "mt-16" : ""}>
            <div className="mb-8 flex items-end justify-between gap-3">
              <h3 className="font-display text-xl font-bold text-ink sm:text-2xl">
                {fileira.slug ? (
                  <Link href={`/secoes/${fileira.slug}`} className="hover:text-signal">
                    {fileira.title}
                  </Link>
                ) : (
                  fileira.title
                )}
              </h3>
              {fileira.slug && (
                <Link
                  href={`/secoes/${fileira.slug}`}
                  className="shrink-0 text-sm font-semibold text-signal hover:underline"
                >
                  Ver tudo
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {fileira.products.map((produto) => (
                <ProductCard key={produto.slug} product={produto} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
