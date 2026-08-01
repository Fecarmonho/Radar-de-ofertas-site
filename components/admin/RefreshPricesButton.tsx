"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Resultado {
  checked: number;
  updated: number;
  unchanged: number;
  failed: number;
  skipped: number;
  changes: { slug: string; title: string; from: string; to: string }[];
}

/**
 * Dispara na hora a mesma rotina que roda sozinha todo dia. Útil depois
 * de cadastrar vários produtos ou quando você quer conferir uma promoção
 * que acabou de sair.
 */
export default function RefreshPricesButton() {
  const router = useRouter();
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function atualizar() {
    setRodando(true);
    setErro(null);
    setResultado(null);

    try {
      const response = await fetch("/api/cron/refresh-prices", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível atualizar.");
      setResultado(data);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao atualizar preços.");
    } finally {
      setRodando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={atualizar}
        disabled={rodando}
        className="w-full rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/30 disabled:opacity-60 sm:w-auto"
      >
        {rodando ? "Conferindo na Shopee..." : "Atualizar preços agora"}
      </button>

      {erro && <p className="mt-2 text-sm font-medium text-ember">{erro}</p>}

      {resultado && (
        <div className="mt-2 rounded-lg bg-paper px-3 py-2 text-xs text-ink/70">
          <p>
            {resultado.checked} conferidos · {resultado.updated} atualizados ·{" "}
            {resultado.unchanged} sem mudança
            {resultado.failed > 0 && ` · ${resultado.failed} sem preço na página`}
            {resultado.skipped > 0 && ` · ${resultado.skipped} ficaram para a próxima`}
          </p>
          {resultado.changes.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {resultado.changes.map((c) => (
                <li key={c.slug}>
                  <span className="font-medium">{c.title}</span>: {c.from} → {c.to}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
