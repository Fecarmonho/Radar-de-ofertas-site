"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteState, SiteStatus, Texto } from "@/lib/site-status-db";

const OPCOES: {
  state: SiteState;
  titulo: string;
  descricao: string;
  cor: string;
}[] = [
  {
    state: "ok",
    titulo: "No ar",
    descricao: "Site funcionando normalmente para todo mundo.",
    cor: "#0F9D58",
  },
  {
    state: "construcao",
    titulo: "Em construção",
    descricao:
      "O site continua no ar e navegável, com uma tarja no topo avisando que o catálogo ainda está sendo montado.",
    cor: "#FF6B00",
  },
  {
    state: "manutencao",
    titulo: "Fora do ar",
    descricao:
      "Ninguém vê o site: toda página vira um aviso de manutenção. Este painel continua funcionando normalmente.",
    cor: "#D93A00",
  },
];

export default function SiteStatusForm({ inicial }: { inicial: SiteStatus }) {
  const router = useRouter();
  const [state, setState] = useState<SiteState>(inicial.state);
  const [construcao, setConstrucao] = useState<Texto>(inicial.textos.construcao);
  const [manutencao, setManutencao] = useState<Texto>(inicial.textos.manutencao);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function salvar() {
    // Tirar o site do ar é o tipo de clique que a pessoa dá sem querer
    // enquanto mexe nos textos. Uma confirmação a mais não machuca.
    if (
      state === "manutencao" &&
      inicial.state !== "manutencao" &&
      !confirm(
        "Isso tira o site do ar agora: qualquer visitante passa a ver só o aviso de manutenção. O painel continua funcionando. Confirma?"
      )
    ) {
      return;
    }

    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      const response = await fetch("/api/admin/site-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, construcao, manutencao }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar.");

      setAviso(
        state === "ok"
          ? "Salvo. O site está no ar."
          : state === "construcao"
            ? "Salvo. A tarja de construção já aparece no site."
            : "Salvo. O site está fora do ar."
      );
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const mudou =
    state !== inicial.state ||
    construcao.title !== inicial.textos.construcao.title ||
    construcao.message !== inicial.textos.construcao.message ||
    manutencao.title !== inicial.textos.manutencao.title ||
    manutencao.message !== inicial.textos.manutencao.message;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-ink/8 bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-base font-bold text-ink">
          Estado do site
        </h2>
        <p className="mt-1 text-sm text-ink/50">
          Vale na hora para o site inteiro — home, páginas de produto, seções e
          busca.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {OPCOES.map((opcao) => {
            const escolhida = state === opcao.state;
            return (
              <label
                key={opcao.state}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                  escolhida
                    ? "border-transparent bg-paper"
                    : "border-ink/10 hover:border-ink/25"
                }`}
                style={escolhida ? { boxShadow: `inset 0 0 0 2px ${opcao.cor}` } : undefined}
              >
                <input
                  type="radio"
                  name="site-state"
                  checked={escolhida}
                  onChange={() => setState(opcao.state)}
                  className="mt-1 h-4 w-4 shrink-0 accent-accent"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: opcao.cor }}
                    />
                    <span className="font-semibold text-ink">{opcao.titulo}</span>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink/55">
                    {opcao.descricao}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {erro && <p className="mt-4 text-sm font-medium text-ember">{erro}</p>}
        {aviso && <p className="mt-4 text-sm font-medium text-ink/60">{aviso}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando || !mudou}
            className="btn-fire rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          {!mudou && !aviso && (
            <span className="text-xs text-ink/40">Nada mudou ainda.</span>
          )}
        </div>
      </div>

      <BlocoTexto
        titulo="Texto da tarja de construção"
        explicacao="Aparece numa faixa laranja no topo de todas as páginas, com o site funcionando normalmente."
        texto={construcao}
        onChange={setConstrucao}
        limiteTitulo={70}
        limiteMensagem={240}
        preview={
          <div className="rounded-lg bg-gradient-to-r from-amber via-accent to-ember px-4 py-2.5 text-center text-white">
            <p className="text-xs leading-snug">
              <span className="font-bold">{construcao.title}</span>
              <span className="mx-2 opacity-50">·</span>
              <span className="opacity-90">{construcao.message}</span>
            </p>
          </div>
        }
      />

      <BlocoTexto
        titulo="Texto do aviso de manutenção"
        explicacao="Aparece sozinho na tela, no lugar do site. Dá para deixar escrito agora e só usar no dia que precisar."
        texto={manutencao}
        onChange={setManutencao}
        limiteTitulo={70}
        limiteMensagem={240}
        preview={
          <div className="hero-night rounded-lg px-4 py-8 text-center">
            <p className="font-display text-lg font-extrabold text-white">
              {manutencao.title}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-white/60">
              {manutencao.message}
            </p>
          </div>
        }
      />
    </div>
  );
}

function BlocoTexto({
  titulo,
  explicacao,
  texto,
  onChange,
  limiteTitulo,
  limiteMensagem,
  preview,
}: {
  titulo: string;
  explicacao: string;
  texto: Texto;
  onChange: (texto: Texto) => void;
  limiteTitulo: number;
  limiteMensagem: number;
  preview: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 shadow-card sm:p-6">
      <h2 className="font-display text-base font-bold text-ink">{titulo}</h2>
      <p className="mt-1 text-sm text-ink/50">{explicacao}</p>

      <div className="mt-4">{preview}</div>

      <label className="mt-4 block text-sm font-medium text-ink/80">
        Título
        <input
          value={texto.title}
          onChange={(e) => onChange({ ...texto, title: e.target.value })}
          maxLength={limiteTitulo}
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </label>

      <label className="mt-3 block text-sm font-medium text-ink/80">
        Mensagem
        <textarea
          value={texto.message}
          onChange={(e) => onChange({ ...texto, message: e.target.value })}
          maxLength={limiteMensagem}
          rows={3}
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-ink/40">
          Se ficar vazio, o site usa o texto padrão. O botão Salvar lá em cima
          grava o estado e os dois textos de uma vez.
        </span>
      </label>
    </div>
  );
}
