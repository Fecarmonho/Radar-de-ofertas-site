import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getAllProducts, getProductBySlug } from "@/lib/products-db";
import { getAllSections } from "@/lib/sections-db";
import {
  buildTrackedGoUrl,
  extrairValoresBRL,
  isPriceRange,
  NETWORKS,
  paraCard,
  Product,
  urlDaFoto,
} from "@/lib/affiliates";
import { urlAbsoluta } from "@/lib/site-url";
import ProductCard from "@/components/ProductCard";

// Revalida a página a cada 60s e permite renderizar sob demanda slugs
// que ainda não existiam no build (produto criado depois pelo admin).
export const revalidate = 60;

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};

  const descricao = `${product.shortDescription} A partir de ${product.price} na ${
    NETWORKS[product.network].label
  }.`;

  // Preview do link (WhatsApp, Instagram, Facebook): precisa de uma URL
  // absoluta que a rede consiga buscar. Foto da Shopee já é URL; foto
  // enviada à mão fica em base64 e é servida por /imagens/<slug>.
  const imagemPreview = urlAbsoluta(urlDaFoto(product));

  return {
    title: product.title,
    description: descricao,
    alternates: { canonical: `/produtos/${product.slug}` },
    openGraph: {
      type: "article",
      title: product.title,
      description: descricao,
      url: `/produtos/${product.slug}`,
      images: [{ url: imagemPreview, alt: product.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: descricao,
      images: [imagemPreview],
    },
  };
}

/**
 * Monta a oferta do schema.org.
 *
 * Preço em faixa ("R$ 16,99 - R$ 48,99") precisa virar AggregateOffer com
 * lowPrice/highPrice. Mandar a string crua fazia o Google recusar a ficha
 * inteira — sem estrela, sem preço no resultado de busca.
 */
function montarOferta(product: Product, url: string) {
  const valores = extrairValoresBRL(product.price);
  if (valores.length === 0) return undefined;

  const base = {
    priceCurrency: "BRL",
    availability: "https://schema.org/InStock",
    url,
  };

  if (isPriceRange(product.price) && valores.length > 1) {
    return {
      "@type": "AggregateOffer",
      ...base,
      lowPrice: Math.min(...valores).toFixed(2),
      highPrice: Math.max(...valores).toFixed(2),
      offerCount: 1,
    };
  }

  return { "@type": "Offer", ...base, price: valores[0].toFixed(2) };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [todos, sections] = await Promise.all([getAllProducts(), getAllSections()]);
  const secao = sections.find((s) => s.slug === product.sectionSlug);

  // Ofertas parecidas: mesma seção primeiro, completando com a mesma categoria.
  const relacionados = todos
    .filter((p) => p.slug !== product.slug)
    .filter((p) =>
      product.sectionSlug
        ? p.sectionSlug === product.sectionSlug
        : p.category === product.category
    )
    .slice(0, 3);

  const urlProduto = urlAbsoluta(`/produtos/${product.slug}`);
  const paragrafos = (product.review ?? "")
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription,
    ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
    image: urlAbsoluta(urlDaFoto(product)),
    ...(product.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount ?? 1,
      },
    }),
    ...(montarOferta(product, urlProduto) && {
      offers: montarOferta(product, urlProduto),
    }),
  };

  const migalhas = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: urlAbsoluta("/") },
      ...(secao
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: secao.name,
              item: urlAbsoluta(`/secoes/${secao.slug}`),
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: secao ? 3 : 2,
        name: product.title,
        item: urlProduto,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(migalhas) }}
      />

      <nav aria-label="Você está em" className="flex flex-wrap items-center gap-1.5 text-xs text-ink/45">
        <Link href="/" className="hover:text-signal">
          Início
        </Link>
        <span aria-hidden="true">›</span>
        {secao && (
          <>
            <Link href={`/secoes/${secao.slug}`} className="hover:text-signal">
              {secao.name}
            </Link>
            <span aria-hidden="true">›</span>
          </>
        )}
        <span className="text-ink/60">{product.title}</span>
      </nav>

      <span className="mt-4 block text-xs font-bold uppercase tracking-widest text-signal">
        {NETWORKS[product.network].label}
      </span>
      <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{product.title}</h1>

      <div className="relative my-6 aspect-video overflow-hidden rounded-2xl border border-ink/8 bg-gradient-to-br from-paper to-ink/5 shadow-card">
        <Image
          src={urlDaFoto(product)}
          alt={product.title}
          fill
          className="object-contain p-8"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
      </div>

      <p className="text-ink/80">{product.shortDescription}</p>

      {/* Ficha rápida: só mostra o que existe de verdade no cadastro. */}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          product.rating
            ? {
                termo: "Nota na loja",
                valor: `${product.rating.toFixed(1)} / 5`,
              }
            : null,
          product.reviewCount
            ? {
                termo: "Avaliações",
                valor: product.reviewCount.toLocaleString("pt-BR"),
              }
            : null,
          product.brand ? { termo: "Marca", valor: product.brand } : null,
          { termo: "Categoria", valor: product.category },
        ]
          .filter((item): item is { termo: string; valor: string } => item !== null)
          .map((item) => (
            <div
              key={item.termo}
              className="rounded-xl border border-ink/8 bg-white p-3 shadow-card"
            >
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">
                {item.termo}
              </dt>
              <dd className="mt-1 font-display text-sm font-bold text-ink">{item.valor}</dd>
            </div>
          ))}
      </dl>

      {/* Análise escrita no painel — é o conteúdo original da página. */}
      {paragrafos.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-ink">
            Por que este entrou no radar
          </h2>
          <div className="mt-3 space-y-4 leading-relaxed text-ink/75">
            {paragrafos.map((paragrafo, i) => (
              <p key={i}>{paragrafo}</p>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-ink/8 bg-white p-6 shadow-card sm:flex-row sm:items-center">
        <div className="leading-tight">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-ink/40">
            A partir de
          </span>
          <span
            className={`block whitespace-nowrap font-display font-extrabold text-ink ${
              product.price.length > 12 ? "text-xl sm:text-2xl" : "text-3xl"
            }`}
          >
            {product.price}
          </span>
          {product.priceUpdatedAt && (
            <span className="mt-1 block text-[11px] text-ink/40">
              Preço conferido em{" "}
              {new Date(product.priceUpdatedAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}{" "}
              · confirme o valor final na Shopee
            </span>
          )}
        </div>
        <a
          href={buildTrackedGoUrl(product.slug, "site")}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="btn-fire rounded-full px-6 py-3.5 font-display font-bold text-white"
        >
          Ver oferta na {NETWORKS[product.network].label}
        </a>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-bold text-ink">
            Outras ofertas parecidas
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {relacionados.map((p) => (
              <ProductCard key={p.slug} product={paraCard(p)} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
