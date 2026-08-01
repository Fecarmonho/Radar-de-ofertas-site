"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImageToBase64 } from "@/lib/image-compress";

/** Banner é largo: comprime num tamanho maior que a foto de produto. */
const LADO_MAXIMO = 1400;
const QUALIDADE = 0.72;

export default function BannerSlotForm({
  slot,
  initial,
}: {
  slot: number;
  initial: { image: string; link?: string; alt?: string } | null;
}) {
  const router = useRouter();
  const [image, setImage] = useState(initial?.image ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [alt, setAlt] = useState(initial?.alt ?? "");
  const [processando, setProcessando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessando(true);
    setErro(null);
    setAviso(null);
    try {
      const base64 = await compressImageToBase64(file, LADO_MAXIMO, QUALIDADE);
      setImage(base64);
      setAviso("Foto carregada. Clique em Salvar para publicar no site.");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não consegui ler essa imagem.");
    } finally {
      setProcessando(false);
      e.target.value = "";
    }
  }

  async function salvar() {
    if (!image) {
      setErro("Escolha uma foto primeiro.");
      return;
    }

    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      const response = await fetch(`/api/admin/banners/${slot}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, link, alt }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar.");

      setAviso("Publicado. A home atualiza em até um minuto.");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover() {
    if (!confirm("Tirar essa foto do carrossel? A faixa volta a mostrar o padrão do site.")) {
      return;
    }

    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      const response = await fetch(`/api/admin/banners/${slot}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Não foi possível remover.");

      setImage("");
      setLink("");
      setAlt("");
      setAviso("Foto removida. Essa faixa voltou para o padrão do site.");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao remover.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-bold text-ink">Foto {slot}</h2>
        <span className="text-xs text-ink/40">
          {image ? `faixa ${slot + 2} do carrossel` : "vazio · mostra a faixa padrão"}
        </span>
      </div>

      {/* Prévia no mesmo formato do carrossel (bem largo) */}
      <div className="mt-3 aspect-[21/9] overflow-hidden rounded-xl border border-ink/10 bg-paper">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Prévia da faixa" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-ink/35">
            Sem foto — o carrossel mostra a faixa padrão do site neste lugar
          </div>
        )}
      </div>

      <label className="mt-3 inline-block cursor-pointer rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 hover:border-ink/30">
        {processando ? "Processando..." : image ? "Trocar foto" : "Escolher foto"}
        <input
          type="file"
          accept="image/*"
          onChange={escolherFoto}
          disabled={processando}
          className="hidden"
        />
      </label>
      <p className="mt-1 text-xs text-ink/40">
        O ideal é uma imagem deitada (bem mais larga que alta), tipo 1400x600.
        Ela é reduzida e comprimida aqui no navegador antes de subir.
      </p>

      <label className="mt-4 block text-sm font-medium text-ink/80">
        Link ao clicar (opcional)
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="/produtos/nome-do-produto  ou  https://..."
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none"
        />
      </label>

      <label className="mt-3 block text-sm font-medium text-ink/80">
        Descrição da imagem (opcional)
        <input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Ex: Promoção de fim de semana em eletrodomésticos"
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-ink/40">
          Aparece para leitores de tela e quando a foto não carrega. Ajuda no Google.
        </span>
      </label>

      {erro && <p className="mt-3 text-sm font-medium text-ember">{erro}</p>}
      {aviso && <p className="mt-3 text-sm font-medium text-ink/60">{aviso}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || processando || !image}
          className="btn-fire rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        {initial && (
          <button
            type="button"
            onClick={remover}
            disabled={salvando}
            className="text-sm font-semibold text-ember hover:underline disabled:opacity-60"
          >
            Remover foto
          </button>
        )}
      </div>
    </div>
  );
}
