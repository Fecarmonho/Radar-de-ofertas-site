import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/products-db";
import { getAllSections, getSectionBySlug } from "@/lib/sections-db";
import { paraCard } from "@/lib/affiliates";
import ProductCard from "@/components/ProductCard";

export const revalidate = 60;

export async function generateStaticParams() {
  const secoes = await getAllSections();
  return secoes.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const secao = await getSectionBySlug(params.slug);
  if (!secao) return {};

  const descricao = `As melhores ofertas de ${secao.name.toLowerCase()} detectadas na Shopee, com preço conferido todo dia.`;

  return {
    title: `${secao.name} em oferta`,
    description: descricao,
    alternates: { canonical: `/secoes/${secao.slug}` },
    openGraph: {
      title: `${secao.name} em oferta`,
      description: descricao,
      url: `/secoes/${secao.slug}`,
    },
  };
}

export default async function SecaoPage({ params }: { params: { slug: string } }) {
  const secao = await getSectionBySlug(params.slug);
  if (!secao) notFound();

  const [todos, secoes] = await Promise.all([getAllProducts(), getAllSections()]);
  const produtos = todos.filter((p) => p.sectionSlug === secao.slug);
  const outras = secoes.filter((s) => s.slug !== secao.slug);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <nav aria-label="Você está em" className="flex items-center gap-1.5 text-xs text-ink/45">
        <Link href="/" className="hover:text-signal">
          Início
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-ink/60">{secao.name}</span>
      </nav>

      <p className="mt-5 text-xs font-bold uppercase tracking-widest text-signal">
        No radar
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
        {secao.name}
      </h1>
      <p className="mt-3 max-w-xl text-ink/65">
        {produtos.length === 0
          ? "Ainda não há ofertas nesta seção — o radar continua ligado."
          : `${produtos.length} ${
              produtos.length === 1 ? "oferta detectada" : "ofertas detectadas"
            } nesta seção. O preço de cada uma é conferido na Shopee todo dia.`}
      </p>

      {produtos.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          {produtos.map((produto) => (
            <ProductCard key={produto.slug} product={paraCard(produto)} />
          ))}
        </div>
      )}

      {outras.length > 0 && (
        <section className="mt-16 border-t border-ink/8 pt-8">
          <h2 className="font-display text-lg font-bold text-ink">Outras seções</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {outras.map((s) => (
              <Link
                key={s.slug}
                href={`/secoes/${s.slug}`}
                className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:border-signal hover:text-signal"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
