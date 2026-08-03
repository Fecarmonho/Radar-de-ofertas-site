import Image from "next/image";
import Link from "next/link";
import { ProdutoDoCard, NETWORKS, buildTrackedGoUrl } from "@/lib/affiliates";

const NETWORK_BADGE: Record<ProdutoDoCard["network"], string> = {
  shopee: "bg-[#EE4D2D]/10 text-[#EE4D2D]",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Nota ${rating} de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={i < Math.round(rating) ? "#FF6B00" : "#E5E1DB"}
        >
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * O card é estreito (dois por linha no celular). Um preço simples cabe
 * grande; uma faixa de variação tem o dobro de caracteres e precisa de
 * uma fonte menor para continuar numa linha só, sem empurrar o botão.
 */
function tamanhoDoPreco(price: string): string {
  if (price.length > 20) return "text-[11px] sm:text-base";
  if (price.length > 12) return "text-sm sm:text-lg";
  return "text-lg sm:text-2xl";
}

export default function ProductCard({ product }: { product: ProdutoDoCard }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      {/* Filete superior aceso no hover */}
      <span className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-amber via-accent to-ember opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <Link href={`/produtos/${product.slug}`} className="block">
        <div className="relative aspect-square bg-gradient-to-br from-paper to-ink/5">
          <Image
            src={product.foto}
            alt={product.title}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105 sm:p-6"
            sizes="(max-width: 640px) 50vw, 320px"
          />
          <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-night/85 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber backdrop-blur-sm sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px]">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
            No radar
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2.5 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:px-2.5 sm:py-1 sm:text-[11px] ${NETWORK_BADGE[product.network]}`}
          >
            {NETWORKS[product.network].label}
          </span>
          {/* O número de avaliações é o que dá confiança na oferta, então
              aparece também no celular. Como o card tem ~160px de largura ali,
              as 5 estrelas dão lugar a uma estrela + a nota, que ocupa bem
              menos e diz a mesma coisa. */}
          {(product.rating || product.reviewCount) && (
            <span className="flex items-center gap-1 text-[10px] text-ink/50 sm:text-xs">
              {product.rating && (
                <>
                  <span className="flex items-center gap-0.5 sm:hidden">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#FF6B00">
                      <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
                    </svg>
                    <span className="font-semibold text-ink/70">
                      {product.rating.toFixed(1)}
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <Stars rating={product.rating} />
                  </span>
                </>
              )}
              {product.reviewCount && (
                <span>({product.reviewCount.toLocaleString("pt-BR")})</span>
              )}
            </span>
          )}
        </div>

        <Link href={`/produtos/${product.slug}`}>
          <h3 className="font-display text-sm font-bold leading-snug text-ink transition-colors group-hover:text-signal sm:text-lg">
            {product.title}
          </h3>
        </Link>

        <p className="line-clamp-2 text-xs leading-relaxed text-ink/60 sm:line-clamp-none sm:text-sm">
          {product.shortDescription}
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:pt-4">
          <div className="min-w-0 leading-tight">
            <span className="block text-[9px] font-medium uppercase tracking-wide text-ink/40 sm:text-[11px]">
              A partir de
            </span>
            {/* Faixa de preço ("R$ 16,99 - R$ 48,99") é bem mais larga que um
                preço simples: diminui a fonte em vez de quebrar no meio. */}
            <span
              className={`block whitespace-nowrap font-display font-extrabold text-ink ${tamanhoDoPreco(
                product.price
              )}`}
            >
              {product.price}
            </span>
          </div>
          <a
            href={buildTrackedGoUrl(product.slug, "site")}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="btn-fire flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold text-white sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Ver oferta
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
