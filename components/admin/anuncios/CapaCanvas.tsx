"use client";

import { useEffect, useRef, useState } from "react";
import { AnuncioEstilo } from "@/lib/anuncios/types";

const LARGURA = 1080;
const ALTURA = 1920;

/** Cor de acento e intensidade do gradiente escuro atrás do texto, por estilo. */
const CORES_ESTILO: Record<AnuncioEstilo, { accent: string; scrimBottom: string }> = {
  clean: { accent: "#1B2430", scrimBottom: "rgba(16,22,31,0.72)" },
  "gancho-forte": { accent: "#E8500F", scrimBottom: "rgba(16,22,31,0.88)" },
  beneficio: { accent: "#FF6B00", scrimBottom: "rgba(16,22,31,0.78)" },
  "ugc-review": { accent: "#FFB347", scrimBottom: "rgba(16,22,31,0.84)" },
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

function desenharCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const escala = Math.max(LARGURA / img.width, ALTURA / img.height);
  const w = img.width * escala;
  const h = img.height * escala;
  ctx.drawImage(img, (LARGURA - w) / 2, (ALTURA - h) / 2, w, h);
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
      await document.fonts.ready;

      canvas.width = LARGURA;
      canvas.height = ALTURA;

      const cores = CORES_ESTILO[estilo];

      if (imagem) {
        const img = await carregarImagem(imagem);
        desenharCover(ctx, img);
      } else {
        const fundo = ctx.createLinearGradient(0, 0, 0, ALTURA);
        fundo.addColorStop(0, "#10161F");
        fundo.addColorStop(1, cores.accent);
        ctx.fillStyle = fundo;
        ctx.fillRect(0, 0, LARGURA, ALTURA);
      }

      // Faixa escura de baixo pra cima, pra garantir contraste do texto
      // por cima de qualquer foto.
      const scrim = ctx.createLinearGradient(0, ALTURA * 0.42, 0, ALTURA);
      scrim.addColorStop(0, "rgba(16,22,31,0)");
      scrim.addColorStop(1, cores.scrimBottom);
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, LARGURA, ALTURA);

      const margemX = 72;
      const maxWidth = LARGURA - margemX * 2;

      if (preco) {
        ctx.font = "700 40px Sora, sans-serif";
        ctx.textBaseline = "middle";
        const largura = ctx.measureText(preco).width + 64;
        const x = LARGURA - largura - 48;
        const y = 64;
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
      let y = ALTURA - 260 - (linhasGancho.length - 1) * 92;
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
