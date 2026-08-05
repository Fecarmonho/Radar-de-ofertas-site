import type { Texto } from "@/lib/site-status-db";

/**
 * O que o visitante vê quando o site está em manutenção: esta tela no
 * lugar de qualquer página do site (home, produto, seção, busca).
 *
 * Sem menu e sem links para dentro: se o site está fora do ar, não
 * adianta oferecer caminho para páginas que também estão fora.
 */
export default function SiteOffline({ texto }: { texto: Texto }) {
  return (
    <main className="hero-night flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber via-accent to-ember">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1.5" fill="white" />
          <circle cx="18" cy="21" r="1.5" fill="white" />
          <path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .6h8.7a1 1 0 0 0 1-.7L21 8H6" />
        </svg>
        <span className="absolute inset-0 animate-pulse-ring rounded-full border border-accent/60" />
      </span>

      <p className="mt-6 font-display text-2xl font-bold text-white sm:text-3xl">
        Radar <span className="text-fire">de Ofertas</span>
      </p>

      <h1 className="mt-8 font-display text-3xl font-extrabold text-white sm:text-4xl">
        {texto.title}
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">
        {texto.message}
      </p>
    </main>
  );
}
