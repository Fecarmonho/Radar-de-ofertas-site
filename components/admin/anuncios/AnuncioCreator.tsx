"use client";

import { useEffect, useState } from "react";
import { PRODUCT_CATEGORIES } from "@/lib/affiliates";
import { compressImageToBase64 } from "@/lib/image-compress";
import {
  gerarHashtags,
  gerarPromptImagem,
  gerarPromptVideo,
  gerarSugestaoTexto,
  montarLegenda,
} from "@/lib/anuncios/templates";
import {
  AnuncioDestino,
  AnuncioEstilo,
  AnuncioOrigem,
  DESTINOS,
  ESTILOS,
  ORIGENS,
  ProdutoAnuncio,
} from "@/lib/anuncios/types";
import CapaCanvas from "./CapaCanvas";

const RASCUNHO_KEY = "radar-anuncio-draft";

interface Rascunho {
  origem: AnuncioOrigem;
  link: string;
  produto: ProdutoAnuncio;
  destino: AnuncioDestino;
  estilo: AnuncioEstilo;
  gancho: string;
  textoSecundario: string;
  /** Descrição livre do modelo/pessoa a incluir na imagem/vídeo (opcional). */
  modelo: string;
  promptImagem: string;
  promptVideo: string;
}

function produtoVazio(origem: AnuncioOrigem, link: string): ProdutoAnuncio {
  return { sourceUrl: link, origem };
}

const RASCUNHO_INICIAL: Rascunho = {
  origem: "shopee",
  link: "",
  produto: produtoVazio("shopee", ""),
  destino: "shopee-video",
  estilo: "clean",
  gancho: "",
  textoSecundario: "",
  modelo: "",
  promptImagem: "",
  promptVideo: "",
};

const MARCAS_DIACRITICAS = new RegExp("[̀-ͯ]", "g");

function slugCurto(texto: string | undefined): string {
  if (!texto) return "anuncio";
  return (
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(MARCAS_DIACRITICAS, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "anuncio"
  );
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            value === opt.value
              ? "border-signal bg-signal text-white"
              : "border-ink/15 text-ink/70 hover:border-ink/30"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function AnuncioCreator() {
  const [estado, setEstado] = useState<Rascunho>(RASCUNHO_INICIAL);
  const [carregado, setCarregado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [avisoBusca, setAvisoBusca] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [copiadoImagem, setCopiadoImagem] = useState(false);
  const [copiadoVideo, setCopiadoVideo] = useState(false);

  // Recupera o rascunho salvo (se houver) só depois de montar no cliente —
  // localStorage não existe no lado do servidor.
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(RASCUNHO_KEY);
      if (salvo) {
        const dados = JSON.parse(salvo) as Partial<Rascunho>;
        setEstado((prev) => ({ ...prev, ...dados, produto: dados.produto ?? prev.produto }));
      }
    } catch {
      // rascunho corrompido — ignora e começa do zero
    } finally {
      setCarregado(true);
    }
  }, []);

  useEffect(() => {
    if (!carregado) return;
    localStorage.setItem(RASCUNHO_KEY, JSON.stringify(estado));
  }, [estado, carregado]);

  function updateProduto(patch: Partial<ProdutoAnuncio>) {
    setEstado((prev) => ({ ...prev, produto: { ...prev.produto, ...patch } }));
  }

  async function buscarDados() {
    const url = estado.link.trim();
    if (!url) {
      setAvisoBusca("Cole o link primeiro.");
      return;
    }

    setBuscando(true);
    setAvisoBusca(null);

    try {
      const response = await fetch("/api/admin/anuncios/resolver-produto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origem: estado.origem, url }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok && !data) {
        setAvisoBusca(`A busca falhou (código ${response.status}). Preencha os campos na mão.`);
        return;
      }
      if (data?.suportado === false) {
        setAvisoBusca(data.aviso);
        updateProduto({ sourceUrl: url, origem: estado.origem });
        return;
      }
      if (data?.error) {
        setAvisoBusca(data.error);
        return;
      }

      const produto: ProdutoAnuncio = data.produto;
      setEstado((prev) => ({ ...prev, produto }));
      setAvisoBusca(
        produto.image
          ? "Preenchi os dados e a foto do produto. Confira e ajuste o que quiser."
          : "Preenchi os dados, mas essa página não trouxe foto — envie uma se quiser."
      );
    } catch {
      setAvisoBusca("Não consegui acessar o link agora. Preencha na mão.");
    } finally {
      setBuscando(false);
    }
  }

  async function handleImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Escolha um arquivo de imagem.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Essa foto é maior que 15MB, escolhe uma menor.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      // Resolução maior que a de capa de produto (640px): aqui a foto
      // ocupa a tela inteira do anúncio em vez de um card pequeno.
      const base64 = await compressImageToBase64(file, 1080, 0.85);
      updateProduto({ image: base64 });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Falha ao processar a foto.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function sugerirTextos() {
    const sugestao = gerarSugestaoTexto(estado.produto, estado.estilo, estado.destino);
    setEstado((prev) => ({ ...prev, gancho: sugestao.gancho, textoSecundario: sugestao.textoSecundario }));
  }

  function sugerirPrompts() {
    const promptImagem = gerarPromptImagem(estado.produto, estado.estilo, estado.modelo);
    const promptVideo = gerarPromptVideo(estado.produto, estado.estilo, estado.destino, estado.modelo);
    setEstado((prev) => ({ ...prev, promptImagem, promptVideo }));
  }

  async function copiarCampo(texto: string, marcar: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(texto);
      marcar(true);
      setTimeout(() => marcar(false), 2000);
    } catch {
      setAvisoBusca("Não consegui copiar automaticamente — selecione o texto na mão.");
    }
  }

  function limparRascunho() {
    localStorage.removeItem(RASCUNHO_KEY);
    setEstado(RASCUNHO_INICIAL);
    setAvisoBusca(null);
  }

  const hashtags = gerarHashtags(estado.produto, estado.destino);
  const legenda = montarLegenda(estado.produto, estado.destino, estado.gancho, estado.textoSecundario);
  const textoParaCopiar = `${legenda}\n\n${hashtags.join(" ")}`;

  async function copiarTudo() {
    try {
      await navigator.clipboard.writeText(textoParaCopiar);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setAvisoBusca("Não consegui copiar automaticamente — selecione o texto na mão.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-ink/8 bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display text-lg font-bold text-ink">1. Produto</h2>

        <div>
          <p className="mb-1 text-sm font-medium text-ink/80">Origem do link</p>
          <ToggleGroup
            options={ORIGENS}
            value={estado.origem}
            onChange={(origem) => setEstado((prev) => ({ ...prev, origem }))}
          />
        </div>

        <label className="block text-sm font-medium text-ink/80">
          Link de afiliado
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <input
              value={estado.link}
              onChange={(e) => setEstado((prev) => ({ ...prev, link: e.target.value }))}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
              placeholder="https://s.shopee.com.br/AbCd123"
            />
            <button
              type="button"
              onClick={buscarDados}
              disabled={buscando || !estado.link.trim()}
              className="whitespace-nowrap rounded-lg border border-signal/40 bg-signal/10 px-4 py-2 text-sm font-bold text-signal transition-colors hover:bg-signal/20 disabled:opacity-50"
            >
              {buscando ? "Buscando..." : "Buscar dados"}
            </button>
          </div>
        </label>
        {avisoBusca && (
          <p className="rounded-lg bg-paper px-3 py-2 text-xs font-medium text-ink/70">{avisoBusca}</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink/80">
            Nome do produto
            <input
              value={estado.produto.title ?? ""}
              onChange={(e) => updateProduto({ title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              placeholder="Ex: Sérum facial vitamina C"
            />
          </label>
          <label className="block text-sm font-medium text-ink/80">
            Preço
            <input
              value={estado.produto.price ?? ""}
              onChange={(e) => updateProduto({ price: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              placeholder="R$ 39,90"
            />
          </label>
          <label className="block text-sm font-medium text-ink/80">
            Categoria
            <select
              value={estado.produto.category ?? PRODUCT_CATEGORIES[0]}
              onChange={(e) => updateProduto({ category: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-ink/80">
            Benefício principal
            <input
              value={estado.produto.benefit ?? ""}
              onChange={(e) => updateProduto({ benefit: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              placeholder="Ex: brilho e maciez"
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-ink/80">Foto do produto</p>
          <div className="mt-1 flex items-center gap-4">
            {estado.produto.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={estado.produto.image}
                alt="Prévia da foto"
                className="h-20 w-20 rounded-lg border border-ink/10 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-ink/15 text-[10px] text-ink/30">
                Sem foto
              </div>
            )}
            <label className="cursor-pointer rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 hover:border-ink/30">
              {uploading ? "Processando..." : estado.produto.image ? "Trocar foto" : "Escolher foto"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImagem}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          <p className="mt-1 text-xs text-ink/40">
            Opcional — use só se quiser substituir ou complementar a foto trazida automaticamente.
          </p>
          {uploadError && <p className="mt-1 text-xs font-medium text-ember">{uploadError}</p>}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/8 bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display text-lg font-bold text-ink">2. Plataforma e estilo</h2>
        <div>
          <p className="mb-1 text-sm font-medium text-ink/80">Plataforma</p>
          <ToggleGroup
            options={DESTINOS}
            value={estado.destino}
            onChange={(destino) => setEstado((prev) => ({ ...prev, destino }))}
          />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-ink/80">Estilo</p>
          <ToggleGroup
            options={ESTILOS}
            value={estado.estilo}
            onChange={(estilo) => setEstado((prev) => ({ ...prev, estilo }))}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/8 bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-ink">3. Texto da capa</h2>
          <button
            type="button"
            onClick={sugerirTextos}
            className="whitespace-nowrap rounded-full border border-signal/40 bg-signal/10 px-4 py-2 text-sm font-bold text-signal transition-colors hover:bg-signal/20"
          >
            Sugerir textos
          </button>
        </div>
        <label className="block text-sm font-medium text-ink/80">
          Gancho
          <input
            value={estado.gancho}
            onChange={(e) => setEstado((prev) => ({ ...prev, gancho: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="Gerado automaticamente"
          />
        </label>
        <label className="block text-sm font-medium text-ink/80">
          Texto secundário
          <input
            value={estado.textoSecundario}
            onChange={(e) => setEstado((prev) => ({ ...prev, textoSecundario: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="Ex: veja o resultado"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/8 bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-ink">4. Prompts para IA</h2>
          <button
            type="button"
            onClick={sugerirPrompts}
            className="whitespace-nowrap rounded-full border border-signal/40 bg-signal/10 px-4 py-2 text-sm font-bold text-signal transition-colors hover:bg-signal/20"
          >
            Sugerir prompts
          </button>
        </div>
        <p className="text-xs text-ink/50">
          Texto pronto pra colar no GPT (melhorar a foto / trocar o modelo) e no
          Veo/Gemini (gerar o vídeo). Não gera nada sozinho — é só o prompt, editável.
        </p>
        <label className="block text-sm font-medium text-ink/80">
          Descrição do modelo (opcional)
          <input
            value={estado.modelo}
            onChange={(e) => setEstado((prev) => ({ ...prev, modelo: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="Ex: mulher jovem, sorridente, pele negra"
          />
        </label>

        <label className="block text-sm font-medium text-ink/80">
          Prompt de imagem (GPT)
          <textarea
            value={estado.promptImagem}
            onChange={(e) => setEstado((prev) => ({ ...prev, promptImagem: e.target.value }))}
            rows={4}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="Clique em “Sugerir prompts” para gerar"
          />
        </label>
        <button
          type="button"
          onClick={() => copiarCampo(estado.promptImagem, setCopiadoImagem)}
          disabled={!estado.promptImagem}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 hover:border-ink/30 disabled:opacity-40"
        >
          {copiadoImagem ? "Copiado!" : "Copiar prompt de imagem"}
        </button>

        <label className="block text-sm font-medium text-ink/80">
          Prompt de vídeo (Veo / Gemini)
          <textarea
            value={estado.promptVideo}
            onChange={(e) => setEstado((prev) => ({ ...prev, promptVideo: e.target.value }))}
            rows={4}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="Clique em “Sugerir prompts” para gerar"
          />
        </label>
        <button
          type="button"
          onClick={() => copiarCampo(estado.promptVideo, setCopiadoVideo)}
          disabled={!estado.promptVideo}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 hover:border-ink/30 disabled:opacity-40"
        >
          {copiadoVideo ? "Copiado!" : "Copiar prompt de vídeo"}
        </button>
      </section>

      <section className="rounded-2xl border border-ink/8 bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-4 font-display text-lg font-bold text-ink">5. Capa 9:16</h2>
        <CapaCanvas
          imagem={estado.produto.image}
          gancho={estado.gancho || estado.produto.title || "Seu gancho aqui"}
          textoSecundario={estado.textoSecundario}
          preco={estado.produto.price}
          estilo={estado.estilo}
          nomeArquivo={`capa-${slugCurto(estado.produto.title)}-${estado.estilo}`}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-ink/8 bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display text-lg font-bold text-ink">Legenda + hashtags</h2>
        <textarea
          readOnly
          value={textoParaCopiar}
          rows={6}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink/80 focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copiarTudo}
            className="btn-fire rounded-full px-5 py-2 text-sm font-bold text-white"
          >
            {copiado ? "Copiado!" : "Copiar tudo"}
          </button>
          <button
            type="button"
            onClick={limparRascunho}
            className="rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink/60 hover:border-ink/30"
          >
            Limpar e começar de novo
          </button>
        </div>
      </section>
    </div>
  );
}
