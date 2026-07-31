"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const AUTOPLAY_MS = 5500;

/* Ilustrações originais (SVG), sem depender de fotos/logos de terceiros. */

function GlossyDefs() {
  return (
    <defs>
      <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
        <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** Selinho circular flutuante (cifrão, %, estrela) — reforça o clima "premium". */
function FloatBadge({
  className,
  delay = "0s",
  size = 44,
  children,
}: {
  className: string;
  delay?: string;
  size?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`animate-float-slow absolute flex items-center justify-center rounded-full shadow-glow ${className}`}
      style={{
        width: size,
        height: size,
        animationDelay: delay,
        background: "linear-gradient(135deg, #FF8A1E 0%, #FF6B00 55%, #E8500F 100%)",
      }}
    >
      {children}
    </div>
  );
}

function BagIllustration() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden="true">
      <GlossyDefs />
      <radialGradient id="bg1" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
      </radialGradient>
      <circle cx="160" cy="160" r="150" fill="url(#bg1)" />
      <g filter="url(#softGlow)">
        <rect x="95" y="130" width="130" height="120" rx="16" fill="#FF6B00" />
        <rect x="95" y="130" width="130" height="120" rx="16" fill="url(#sheen)" />
      </g>
      <path d="M120 130v-20a40 40 0 0 1 80 0v20" fill="none" stroke="#FFE9D6" strokeWidth="10" strokeLinecap="round" />
      <circle cx="160" cy="185" r="27" fill="#FFF5EB" />
      <text x="160" y="195" textAnchor="middle" fontSize="27" fontWeight="800" fill="#E8500F">%</text>
    </svg>
  );
}

function BoxIllustration() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden="true">
      <GlossyDefs />
      <radialGradient id="bg2" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
      </radialGradient>
      <circle cx="160" cy="160" r="150" fill="url(#bg2)" />
      <g filter="url(#softGlow)">
        <polygon points="160,90 240,130 240,220 160,260 80,220 80,130" fill="#E8500F" />
        <polygon points="160,90 240,130 160,170 80,130" fill="#FF8A1E" />
        <polygon points="160,170 240,130 240,220 160,260" fill="#B8330A" />
      </g>
      <line x1="160" y1="170" x2="160" y2="260" stroke="#7A2205" strokeWidth="3" />
      <path d="M130 105 165 88 200 105" fill="none" stroke="#FFE9D6" strokeWidth="6" strokeLinecap="round" />
      <polygon points="160,90 200,110 160,130 120,110" fill="url(#sheen)" opacity="0.7" />
    </svg>
  );
}

function CartIllustration() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden="true">
      <GlossyDefs />
      <radialGradient id="bg3" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
      </radialGradient>
      <circle cx="160" cy="160" r="150" fill="url(#bg3)" />
      <g filter="url(#softGlow)" fill="none" stroke="#FF6B00" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
        <path d="M75 90h24l14 118a18 18 0 0 0 18 16h96a18 18 0 0 0 17-13l20-70H115" />
      </g>
      <circle cx="140" cy="248" r="14" fill="#FFB347" />
      <circle cx="222" cy="248" r="14" fill="#FFB347" />
      <circle cx="222" cy="140" r="30" fill="#FFF5EB" />
      <text x="222" y="150" textAnchor="middle" fontSize="28" fontWeight="800" fill="#E8500F">
        R$
      </text>
    </svg>
  );
}

function TagIllustration() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden="true">
      <GlossyDefs />
      <radialGradient id="bg4" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
      </radialGradient>
      <circle cx="160" cy="160" r="150" fill="url(#bg4)" />
      <g filter="url(#softGlow)" transform="rotate(-8 160 160)">
        <path d="M100 100h70l70 70-90 90-70-70v-70a20 20 0 0 1 20-20z" fill="#FF6B00" />
        <path d="M100 100h70l70 70-90 90-70-70v-70a20 20 0 0 1 20-20z" fill="url(#sheen)" />
        <circle cx="120" cy="120" r="12" fill="#FFF5EB" />
      </g>
      <text x="160" y="200" textAnchor="middle" fontSize="34" fontWeight="800" fill="#FFF5EB">
        R$
      </text>
    </svg>
  );
}

const ICON_DOLLAR = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF5EB" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2v20M17 6.5c0-1.9-2-3-5-3s-5 1.3-5 3.2c0 4 10 2 10 6 0 2-2.2 3.3-5 3.3s-5-1.1-5-3" />
  </svg>
);
const ICON_PERCENT = (
  <span className="font-display text-sm font-extrabold text-white">%</span>
);
const ICON_STAR = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFF5EB">
    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
  </svg>
);

const SLIDES = [
  {
    badge: "Toda a Shopee, num só radar",
    title: "Suas compras\ncom preço de verdade",
    description:
      "Sem promoção maquiada: só entram no radar produtos que valem cada centavo.",
    cta: { label: "Ver ofertas do radar", href: "#ofertas" },
    Illustration: BagIllustration,
  },
  {
    badge: "Do clique à sua porta",
    title: "Compre com\nsegurança total",
    description:
      "Todo link leva direto pra loja oficial da Shopee — você compra, garante e recebe.",
    cta: { label: "Como funciona", href: "#como-funciona" },
    Illustration: BoxIllustration,
  },
  {
    badge: "Comparação de verdade",
    title: "Preço, nota e\ncusto-benefício",
    description:
      "Cada produto é comparado com os concorrentes antes de entrar no radar.",
    cta: { label: "Ver ofertas do radar", href: "#ofertas" },
    Illustration: CartIllustration,
  },
  {
    badge: "Atualizado todo dia",
    title: "Novas ofertas\nsempre no ar",
    description: "O radar não desliga. Volte sempre pra não perder a próxima detecção.",
    cta: { label: "Ver ofertas do radar", href: "#ofertas" },
    Illustration: TagIllustration,
  },
];

export default function BannerCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback((i: number) => {
    setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, paused]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    const SWIPE_THRESHOLD = 45;
    if (delta > SWIPE_THRESHOLD) prev();
    else if (delta < -SWIPE_THRESHOLD) next();
    touchStartX.current = null;
  }

  const slide = SLIDES[index];
  const { Illustration } = slide;

  return (
    <div
      className="hero-night relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-grid absolute inset-0" aria-hidden="true" />

      <div
        key={index}
        className="animate-fade-slide relative flex flex-col-reverse items-center justify-center gap-6 px-6 py-10 pb-14 sm:min-h-[420px] sm:flex-row sm:justify-between sm:px-16 sm:py-16 sm:pb-16 lg:min-h-[480px] lg:px-24"
      >
        <div className="max-w-lg text-center text-white sm:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber">
            <span className="h-2 w-2 animate-blink rounded-full bg-accent" />
            {slide.badge}
          </span>
          <h1 className="mt-4 whitespace-pre-line font-display text-2xl font-extrabold leading-tight sm:mt-5 sm:text-4xl lg:text-5xl">
            {slide.title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/70 sm:mx-0 sm:mt-4 sm:text-base">
            {slide.description}
          </p>
          <Link
            href={slide.cta.href}
            className="btn-fire mt-5 inline-block rounded-full px-6 py-3 font-display text-sm font-bold text-white sm:mt-6 sm:px-7 sm:py-3.5 sm:text-base"
          >
            {slide.cta.label}
          </Link>
        </div>

        {/* Ícone principal + selinhos flutuantes + logo em destaque */}
        <div className="relative h-32 w-32 shrink-0 sm:h-56 sm:w-56 lg:h-64 lg:w-64">
          <Illustration />

          <FloatBadge className="left-0 top-1 sm:-left-2 sm:top-4" delay="0s" size={30}>
            {ICON_DOLLAR}
          </FloatBadge>
          <FloatBadge className="right-0 top-0 sm:-right-3 sm:top-2" delay="0.8s" size={26}>
            {ICON_PERCENT}
          </FloatBadge>
          <FloatBadge className="bottom-1 right-1 sm:-right-2 sm:bottom-6" delay="1.6s" size={24}>
            {ICON_STAR}
          </FloatBadge>

          {/* Selo com a logo do Radar de Ofertas, sempre em destaque */}
          <div
            className="animate-float-slow absolute -bottom-2 left-1/2 -translate-x-1/2 sm:bottom-2 sm:left-0 sm:translate-x-0"
            style={{ animationDelay: "0.4s" }}
          >
            <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-accent/50" aria-hidden="true" />
            <Image
              src="/logo.png"
              alt="Radar de Ofertas"
              width={48}
              height={48}
              className="relative rounded-full shadow-glow ring-2 ring-white/20 sm:h-14 sm:w-14"
            />
          </div>
        </div>
      </div>

      {/* Setas — visíveis também no celular, tamanho maior pra ser fácil de tocar */}
      <button
        onClick={prev}
        aria-label="Slide anterior"
        className="absolute left-2 top-1/2 z-20 flex -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:bg-white/25 sm:left-3 sm:p-2.5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:h-[18px] sm:w-[18px]">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={next}
        aria-label="Próximo slide"
        className="absolute right-2 top-1/2 z-20 flex -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:bg-white/25 sm:right-3 sm:p-2.5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:h-[18px] sm:w-[18px]">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Pontos — área de toque ampliada (padding invisível) pra facilitar no celular */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1 sm:bottom-5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ir para o slide ${i + 1}`}
            className="p-2"
          >
            <span
              className={`block h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-accent" : "w-1.5 bg-white/30"
              }`}
            />
          </button>
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
    </div>
  );
}
