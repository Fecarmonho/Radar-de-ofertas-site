import type { Texto } from "@/lib/site-status-db";

/**
 * Tarja do modo "em construção": o site funciona normalmente, mas o
 * visitante fica sabendo que o catálogo ainda está sendo montado.
 *
 * Fica acima do cabeçalho e sai da tela ao rolar — o cabeçalho é que é
 * fixo. O aviso é para a primeira impressão, não para acompanhar a
 * pessoa a página inteira.
 */
export default function ConstructionBar({ texto }: { texto: Texto }) {
  return (
    <div className="bg-gradient-to-r from-amber via-accent to-ember px-4 py-2.5 text-center text-white">
      <p className="mx-auto max-w-3xl text-sm leading-snug">
        <span className="font-bold">{texto.title}</span>
        <span className="mx-2 opacity-50">·</span>
        <span className="opacity-90">{texto.message}</span>
      </p>
    </div>
  );
}
