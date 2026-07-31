import Image from "next/image";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-night text-white/60">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white">
                <Image
                  src="/logo.png"
                  alt="Radar de Ofertas"
                  width={64}
                  height={64}
                  className="scale-[1.08]"
                />
              </span>
              <p className="font-display text-xl font-bold text-white">
                Radar <span className="text-fire">de Ofertas</span>
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed">
              Rastreamos as melhores ofertas da Shopee para você comprar bem,
              sem cair em falsa promoção.
            </p>
          </div>

          <nav className="flex gap-10 text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-white">Navegue</span>
              <Link href="/#ofertas" className="hover:text-accent">
                Ofertas
              </Link>
              <Link href="/#como-funciona" className="hover:text-accent">
                Como funciona
              </Link>
            </div>
          </nav>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed">
          Este site participa do programa de afiliados da Shopee. Ao comprar
          pelos nossos links, podemos receber uma comissão — sem custo extra
          para você. Os preços exibidos podem variar; confira sempre o valor
          final na loja.
        </p>
      </div>
    </footer>
  );
}
