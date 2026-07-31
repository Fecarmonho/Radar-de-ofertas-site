"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, buildTrackedGoUrl } from "@/lib/affiliates";

const AUTOPLAY_MS = 6000;

export default function HeroCarousel({ products }: { products: Product[] }) {
  const slides = products.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, paused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="group/carousel relative overflow-hidden rounded-3xl border border-white/10 bg-night/40 shadow-glow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
        {slides.map((product, i) => (
          <div
            key={product.slug}
            className={`absolute inset-0 flex flex-col items-center justify-end gap-4 p-6 transition-opacity duration-700 ease-out sm:flex-row sm:items-center sm:justify-between sm:p-10 lg:p-14 ${
              i === index ? "z-10 opacity-100" : "z-0 opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            {/* Foto do produto */}
            <div className="absolute inset-0 -z-10">
              <Image
                src={product.image}
                alt=""
                fill
                priority={i === 0}
                className="object-cover opacity-25 blur-sm sm:opacity-30"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night via-night/70 to-night/30 sm:bg-gradient-to-r" />
            </div>

            <div className="max-w-lg text-center text-white sm:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber">
                <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
                Oferta #{i + 1} no radar
              </span>
              <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
                {product.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm text-white/70 sm:text-base">
                {product.shortDescription}
              </p>
              <div className="mt-3 font-display text-3xl font-extrabold text-fire sm:text-4xl">
                {product.price}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={buildTrackedGoUrl(product.slug, "hero-carousel")}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className="btn-fire rounded-full px-6 py-3 text-center font-display font-bold text-white"
                >
                  Ver oferta na Shopee
                </a>
                <Link
                  href={`/produtos/${product.slug}`}
                  className="rounded-full border border-white/25 px-6 py-3 text-center font-display text-sm font-semibold text-white/85 transition-colors hover:border-accent hover:text-white"
                >
                  Ver detalhes
                </Link>
              </div>
            </div>

            <div className="relative hidden h-56 w-56 shrink-0 sm:block lg:h-72 lg:w-72">
              <div className="absolute inset-0 rounded-3xl bg-white/5 backdrop-blur-sm" />
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-contain p-6"
                sizes="288px"
              />
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          {/* Setas */}
          <button
            onClick={prev}
            aria-label="Oferta anterior"
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:flex"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Próxima oferta"
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:flex"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Pontos */}
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ir para oferta ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-accent" : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          {/* Barra de progresso do autoplay */}
          {!paused && (
            <div className="absolute inset-x-0 bottom-0 z-20 h-0.5 bg-white/10">
              <div
                key={index}
                className="h-full origin-left animate-shrink-x bg-accent"
                style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
