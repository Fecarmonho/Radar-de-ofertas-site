import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getAllProducts, getProductBySlug } from "@/lib/products-db";
import { buildTrackedGoUrl, NETWORKS } from "@/lib/affiliates";

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

  return {
    title: product.title,
    description: product.shortDescription,
    openGraph: {
      title: product.title,
      description: product.shortDescription,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription,
    brand: product.brand,
    image: product.image,
    ...(product.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount ?? 1,
      },
    }),
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: product.price.replace(/[^\d,]/g, "").replace(",", "."),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <span className="text-xs font-bold uppercase tracking-widest text-signal">
        {NETWORKS[product.network].label}
      </span>
      <h1 className="mt-2 font-display text-3xl font-bold">{product.title}</h1>

      <div className="relative my-6 aspect-video overflow-hidden rounded-2xl border border-ink/8 bg-gradient-to-br from-paper to-ink/5 shadow-card">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-contain p-8"
        />
      </div>

      <p className="text-ink/80">{product.shortDescription}</p>

      {/*
        Espaço para o review real: prós/contras, comparação com
        concorrentes, fotos próprias, vídeo de unboxing embutido.
        Conteúdo original aqui é o que sustenta SEO e Quality Score
        no Google Ads — evite copiar a descrição do anunciante.
      */}

      <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-ink/8 bg-white p-6 shadow-card sm:flex-row sm:items-center">
        <div className="leading-tight">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-ink/40">
            A partir de
          </span>
          <span className="font-display text-3xl font-extrabold text-ink">
            {product.price}
          </span>
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
    </main>
  );
}
