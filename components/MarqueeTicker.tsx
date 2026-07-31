const ITEMS = [
  "RADAR DE OFERTAS",
  "✦ PREÇO REAL ✦",
  "SEM PROMOÇÃO MAQUIADA",
  "✦ COMPARAMOS ANTES ✦",
  "TUDO NA SHOPEE",
  "✦ ATUALIZADO SEMPRE ✦",
];

export default function MarqueeTicker() {
  // Duplicamos a lista pra criar o efeito de loop infinito sem "salto".
  const track = [...ITEMS, ...ITEMS];

  return (
    <div
      className="overflow-hidden border-y border-white/10 bg-night py-3"
      aria-hidden="true"
    >
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
        {track.map((item, i) => (
          <span
            key={i}
            className={`font-display text-sm font-bold uppercase tracking-widest ${
              i % 2 === 0 ? "text-fire" : "text-white/40"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
