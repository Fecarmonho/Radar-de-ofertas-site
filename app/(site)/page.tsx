import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/products-db";
import ProductCard from "@/components/ProductCard";
import BannerCarousel from "@/components/BannerCarousel";
import MarqueeTicker from "@/components/MarqueeTicker";

// Revalida a home a cada 60s, assim produtos criados/editados no painel
// de admin aparecem no site sem precisar de um novo deploy.
export const revalidate = 60;

const stores = [{ name: "Shopee", color: "#EE4D2D" }];

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
  const products = await getAllProducts();
  return (
    <main>
      {/* ── BANNER (topo absoluto da página) ─────────────────────── */}
      <BannerCarousel />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="hero-night relative overflow-hidden text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 pb-20 pt-16 lg:flex-row lg:justify-between lg:gap-8 lg:pb-28 lg:pt-24">
          <div className="max-w-xl text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber">
              <span className="h-2 w-2 animate-blink rounded-full bg-accent" />
              Radar ligado · ofertas ao vivo
            </span>

            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              As melhores ofertas,{" "}
              <span className="text-fire">detectadas</span> antes de todo mundo
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-lg text-white/70 lg:mx-0">
              Varremos a Shopee para encontrar
              produtos que valem cada centavo. Você só vê o que passou no nosso
              radar.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="#ofertas"
                className="btn-fire rounded-full px-8 py-4 font-display text-base font-bold text-white"
              >
                Ver ofertas no radar
              </Link>
              <Link
                href="#como-funciona"
                className="rounded-full border border-white/20 px-8 py-4 font-display text-base font-semibold text-white/80 transition-colors hover:border-accent hover:text-white"
              >
                Como funciona
              </Link>
            </div>

            {/* Lojas monitoradas */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <span className="text-xs font-medium uppercase tracking-wider text-white/40">
                Monitorando
              </span>
              {stores.map((store) => (
                <span
                  key={store.name}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/80"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: store.color }}
                  />
                  {store.name}
                </span>
              ))}
            </div>
          </div>

          <div className="animate-float-slow relative shrink-0">
            {/* Anéis de pulso atrás do logo */}
            <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-accent/50" aria-hidden="true" />
            <span
              className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-amber/40"
              style={{ animationDelay: "1.2s" }}
              aria-hidden="true"
            />
            <span
              className="absolute inset-[-10%] rounded-full bg-accent/20 blur-3xl"
              aria-hidden="true"
            />
            <Image
              src="/logo.png"
              alt="Logo Radar de Ofertas"
              width={460}
              height={460}
              priority
              className="relative w-[320px] rounded-full shadow-glow sm:w-[400px] lg:w-[460px]"
            />
          </div>
        </div>

        {/* Transição suave para a área clara */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-paper"
          aria-hidden="true"
        />
      </section>

      <MarqueeTicker />

      {/* ── OFERTAS ───────────────────────────────────────────── */}
      <section id="ofertas" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-signal">
              Detectadas agora
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
              Ofertas no radar
            </h2>
          </div>
          <p className="max-w-sm text-sm text-ink/60">
            Cada produto abaixo foi comparado com os concorrentes antes de
            entrar aqui. Preço confere na loja oficial.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

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
            href="#ofertas"
            className="btn-fire mt-8 inline-block rounded-full px-8 py-4 font-display font-bold text-white"
          >
            Explorar ofertas
          </Link>
        </div>
      </section>
    </main>
  );
}
