"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImageToBase64 } from "@/lib/image-compress";

/** Banner é largo: comprime num tamanho maior que a foto de produto. */
const LADO_MAXIMO = 1400;
const QUALIDADE = 0.72;

export interface BannerInicial {
  image: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  link?: string;
  alt?: string;
}

export default function BannerSlotForm({
  slot,
  initial,
}: {
  slot: number;
  initial: BannerInicial | null;
}) {
  const router = useRouter();
  const [image, setImage] = useState(initial?.image ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [ctaLabel, setCtaLabel] = useState(initial?.ctaLabel ?? "");
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
        body: JSON.stringify({ image, title, description, ctaLabel, link, alt }),
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
      setTitle("");
      setDescription("");
      setCtaLabel("");
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

      {/* Prévia com o mesmo desenho da faixa no site: fundo escuro, texto
          de um lado e a foto inteira do outro. */}
      <div className="mt-3 overflow-hidden rounded-xl border border-ink/10 bg-night">
        {image ? (
          <div className="flex min-h-[128px] items-center justify-between gap-4 p-4">
            {(title || description) && (
              <div className="min-w-0 flex-1 text-white">
                {title && (
                  <p className="font-display text-sm font-extrabold leading-tight">
                    {title}
                  </p>
                )}
                {description && (
                  <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-white/60">
                    {description}
                  </p>
                )}
                {link && (
                  <span className="btn-fire mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-bold text-white">
                    {ctaLabel || "Ver oferta"}
                  </span>
                )}
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="Prévia da faixa"
              className={`shrink-0 rounded-lg object-contain ${
                title || description ? "h-24 w-32" : "h-28 w-full"
              }`}
            />
          </div>
        ) : (
          <div className="flex min-h-[128px] items-center justify-center px-4 text-center text-xs text-white/40">
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
        Pode ser deitada, quadrada ou em pé: a foto aparece inteira, sem corte
        nem distorção. Ela é reduzida e comprimida aqui no navegador antes de
        subir.
      </p>

      <label className="mt-4 block text-sm font-medium text-ink/80">
        Frase principal (opcional)
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={90}
          placeholder="Ex: Semana de ofertas em eletrodomésticos"
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-ink/40">
          Deixe vazio para a foto aparecer sozinha, num tamanho maior.
        </span>
      </label>

      <label className="mt-3 block text-sm font-medium text-ink/80">
        Linha de apoio (opcional)
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={180}
          rows={2}
          placeholder="Ex: Selecionamos os melhores preços da semana. Só o que vale a pena."
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </label>

      <label className="mt-3 block text-sm font-medium text-ink/80">
        Texto do botão (opcional)
        <input
          value={ctaLabel}
          onChange={(e) => setCtaLabel(e.target.value)}
          maxLength={32}
          placeholder="Ver oferta"
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-ink/40">
          O botão só aparece se você preencher o link abaixo.
        </span>
      </label>

      <label className="mt-3 block text-sm font-medium text-ink/80">
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
