import Link from "next/link";
import { getAllProducts } from "@/lib/products-db";
import { getAllSections } from "@/lib/sections-db";
import { getBanners } from "@/lib/banners-db";
import { paraCard, Product } from "@/lib/affiliates";
import BannerCarousel from "@/components/BannerCarousel";
import MarqueeTicker from "@/components/MarqueeTicker";
import OfertasBuscaveis, { Fileira } from "@/components/OfertasBuscaveis";

// Revalida a home a cada 60s, assim produtos criados/editados no painel
// de admin aparecem no site sem precisar de um novo deploy.
export const revalidate = 60;

const steps = [
  {
    title: "Rastreamos",
    description:
      "Monitoramos a Shopee atrás de produtos com preço realmente bom — não promoção maquiada.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
      </svg>
    ),
  },
  {
    title: "Comparamos",
    description:
      "Colocamos o produto lado a lado com os concorrentes: preço, avaliações reais e custo-benefício.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v18M16 3v18M3 8h10M11 16h10" />
      </svg>
    ),
  },
  {
    title: "Recomendamos",
    description:
      "Só entra no radar o que vale a pena. Você clica, confere na loja oficial e compra com segurança.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
];

export default async function HomePage() {
  const [products, sections, banners] = await Promise.all([
    getAllProducts(),
    getAllSections(),
    getBanners(),
  ]);

  const bySection = new Map<string, Product[]>();
  const semSecao: Product[] = [];
  for (const product of products) {
    if (product.sectionSlug && sections.some((s) => s.slug === product.sectionSlug)) {
      const list = bySection.get(product.sectionSlug) ?? [];
      list.push(product);
      bySection.set(product.sectionSlug, list);
    } else {
      semSecao.push(product);
    }
  }

  // paraCard corta o produto no que o card precisa — sem isso a foto em
  // base64 viajaria dentro do HTML da home, que é justamente o que pesava.
  const rows: Fileira[] = [
    ...sections
      .filter((s) => (bySection.get(s.slug) ?? []).length > 0)
      .map((s) => ({
        title: s.name,
        slug: s.slug,
        products: bySection.get(s.slug)!.map(paraCard),
      })),
    ...(semSecao.length > 0
      ? [{ title: "Outras ofertas", products: semSecao.map(paraCard) }]
      : []),
  ];

  return (
    <main>
      {/* ── BANNER (topo absoluto da página) ─────────────────────── */}
      <BannerCarousel banners={banners} />

      <MarqueeTicker />

      {/* ── OFERTAS (uma fileira por seção, com busca) ───────────── */}
      <OfertasBuscaveis fileiras={rows} />

      {/* ── COMO FUNCIONA ─────────────────────────────────────── */}
      <section
        id="como-funciona"
        className="border-y border-ink/5 bg-white py-16"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-signal">
              Sem enrolação
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
              Como o radar funciona
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-ink/8 bg-paper p-8 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <span className="absolute right-6 top-6 font-display text-5xl font-extrabold text-ink/5">
                  {i + 1}
                </span>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber via-accent to-ember text-white shadow-glow">
                  {step.icon}
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────── */}
      <section className="hero-night relative overflow-hidden py-16 text-center text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl px-4">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Não perca a próxima <span className="text-fire">detecção</span>
          </h2>
          <p className="mt-3 text-white/70">
            As melhores ofertas somem rápido. Volte sempre — o radar não
            desliga.
          </p>
          <Link
            href="/#ofertas"
            className="btn-fire mt-8 inline-block rounded-full px-8 py-4 font-display font-bold text-white"
          >
            Explorar ofertas
          </Link>
        </div>
      </section>
    </main>
  );
}
