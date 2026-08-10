"use client";

import { useEffect, useRef, useState } from "react";
import { AnuncioEstilo } from "@/lib/anuncios/types";

const LARGURA = 1080;
const ALTURA = 1920;

/** Cartão onde a foto entra inteira — nunca esticada nem cortada. */
const CARD_X = 90;
const CARD_Y = 150;
const CARD_W = LARGURA - CARD_X * 2;
const CARD_H = 1080;
const CARD_RAIO = 40;
const CARD_PADDING = 36;

/** Cor de acento (badge de preço) e do gradiente de fundo, por estilo. */
const CORES_ESTILO: Record<AnuncioEstilo, { accent: string }> = {
  clean: { accent: "#1B2430" },
  "gancho-forte": { accent: "#E8500F" },
  beneficio: { accent: "#FF6B00" },
  "ugc-review": { accent: "#D9862E" },
};

/** Canvas não quebra texto sozinho — mede palavra por palavra até estourar a largura. */
function quebrarLinhas(ctx: CanvasRenderingContext2D, texto: string, maxWidth: number): string[] {
  if (!texto) return [];
  const palavras = texto.split(" ");
  const linhas: string[] = [];
  let atual = "";
  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (atual && ctx.measureText(tentativa).width > maxWidth) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a foto."));
    img.src = src;
  });
}

/**
 * Desenha a imagem inteira dentro da caixa, sem cortar nem distorcer
 * (equivalente a `object-fit: contain`). É de propósito diferente de um
 * "cover" que preenche e corta: a foto do produto (geralmente quadrada,
 * vinda da Shopee) ficava esticada e com as bordas cortadas ao tentar
 * preencher a tela inteira em 9:16 — dentro de um cartão menor ela cabe
 * inteira e não precisa ampliar tanto, o que também deixa menos borrada.
 */
function desenharContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const escala = Math.min(w / img.width, h / img.height);
  const dw = img.width * escala;
  const dh = img.height * escala;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function caminhoArredondado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function CapaCanvas({
  imagem,
  gancho,
  textoSecundario,
  preco,
  estilo,
  nomeArquivo,
}: {
  /** Foto do produto já em base64/same-origin — ver lib/anuncios/platform-adapters.ts. */
  imagem?: string;
  gancho: string;
  textoSecundario: string;
  preco?: string;
  estilo: AnuncioEstilo;
  nomeArquivo: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gerando, setGerando] = useState(false);
  const [pronta, setPronta] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Depois de qualquer mudança nos dados, a prévia antiga fica desatualizada
  // — força clicar em "Gerar capa" de novo antes de liberar o download, pra
  // nunca baixar uma imagem que não bate com o que está no formulário.
  useEffect(() => {
    setPronta(false);
  }, [imagem, gancho, textoSecundario, preco, estilo]);

  async function desenhar() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    setGerando(true);
    setErro(null);
    try {
      const img = imagem ? await carregarImagem(imagem) : null;
      await document.fonts.ready;

      canvas.width = LARGURA;
      canvas.height = ALTURA;

      const cores = CORES_ESTILO[estilo];

      const fundo = ctx.createLinearGradient(0, 0, 0, ALTURA);
      fundo.addColorStop(0, "#10161F");
      fundo.addColorStop(1, cores.accent);
      ctx.fillStyle = fundo;
      ctx.fillRect(0, 0, LARGURA, ALTURA);

      // Cartão claro com a foto inteira dentro — o resto da composição
      // (preço, gancho, texto) fica no fundo colorido ao redor, então não
      // precisa de nenhuma faixa escura por cima da foto pra garantir
      // contraste do texto.
      ctx.save();
      caminhoArredondado(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_RAIO);
      ctx.fillStyle = "#F7F8FB";
      ctx.fill();
      ctx.clip();
      if (img) {
        desenharContain(
          ctx,
          img,
          CARD_X + CARD_PADDING,
          CARD_Y + CARD_PADDING,
          CARD_W - CARD_PADDING * 2,
          CARD_H - CARD_PADDING * 2
        );
      } else {
        ctx.fillStyle = "rgba(27,36,48,0.35)";
        ctx.font = "600 40px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Sem foto", CARD_X + CARD_W / 2, CARD_Y + CARD_H / 2);
        ctx.textAlign = "left";
      }
      ctx.restore();

      const margemX = CARD_X;
      const maxWidth = LARGURA - margemX * 2;

      if (preco) {
        ctx.font = "700 40px Sora, sans-serif";
        ctx.textBaseline = "middle";
        const largura = ctx.measureText(preco).width + 64;
        const x = CARD_X + CARD_W - largura - 16;
        const y = CARD_Y - 24;
        ctx.fillStyle = cores.accent;
        caminhoArredondado(ctx, x, y, largura, 76, 38);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillText(preco, x + 32, y + 38);
      }

      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#fff";
      ctx.font = "800 84px Sora, sans-serif";
      const linhasGancho = quebrarLinhas(ctx, gancho, maxWidth);
      let y = CARD_Y + CARD_H + 130;
      for (const linha of linhasGancho) {
        ctx.fillText(linha, margemX, y);
        y += 92;
      }

      ctx.font = "500 46px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      y += 8;
      for (const linha of quebrarLinhas(ctx, textoSecundario, maxWidth)) {
        ctx.fillText(linha, margemX, y);
        y += 58;
      }

      setPronta(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível gerar a capa.");
    } finally {
      setGerando(false);
    }
  }

  function baixar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nomeArquivo}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="space-y-3">
      <div
        className="mx-auto w-full max-w-[220px] overflow-hidden rounded-xl border border-ink/10 bg-night"
        style={{ aspectRatio: "9 / 16" }}
      >
        <canvas ref={canvasRef} className="h-full w-full object-contain" />
      </div>
      {erro && <p className="text-center text-xs font-medium text-ember">{erro}</p>}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={desenhar}
          disabled={gerando}
          className="rounded-full border border-signal/40 bg-signal/10 px-5 py-2 text-sm font-bold text-signal transition-colors hover:bg-signal/20 disabled:opacity-50"
        >
          {gerando ? "Gerando..." : "Gerar capa 9:16"}
        </button>
        <button
          type="button"
          onClick={baixar}
          disabled={!pronta}
          className="btn-fire rounded-full px-5 py-2 text-sm font-bold text-white disabled:opacity-40"
        >
          Baixar capa
        </button>
      </div>
      <p className="text-center text-xs text-ink/40">Tudo é processado no seu navegador.</p>
    </div>
  );
}
