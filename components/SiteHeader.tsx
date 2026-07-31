import Link from "next/link";

function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber via-accent to-ember ${className}`}
    >
      <svg
        width="20"
        height="20"
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
  );
}

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-night/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark />
          <span className="font-display text-xl font-bold leading-none text-white sm:text-2xl">
            Radar <span className="text-fire">de Ofertas</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-white/70 sm:gap-6">
          <Link href="/#ofertas" className="transition-colors hover:text-white">
            Ofertas
          </Link>
          <Link
            href="/#como-funciona"
            className="hidden transition-colors hover:text-white sm:block"
          >
            Como funciona
          </Link>
          <Link
            href="/#ofertas"
            className="btn-fire whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-white"
          >
            Ver achados
          </Link>
        </nav>
      </div>
    </header>
  );
}
