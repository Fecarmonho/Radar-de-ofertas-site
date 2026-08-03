import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/products-db";

/**
 * Serve a foto de um produto que foi enviada à mão no painel.
 *
 * Essas fotos ficam guardadas como base64 dentro do documento do produto.
 * Se elas forem usadas direto no <img>, o conteúdo da imagem viaja dentro
 * do HTML da página: a home fica com centenas de KB que o navegador não
 * consegue guardar em cache nem adiar o carregamento.
 *
 * Aqui a mesma foto vira um endereço normal de imagem — o navegador
 * carrega sob demanda, guarda em cache e o HTML volta a ser leve.
 *
 * Fora de /api de propósito: o robots.txt bloqueia /api, e imagem de
 * produto bloqueada atrapalha o Google.
 */
export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const product = await getProductBySlug(params.slug);

  if (!product?.image?.startsWith("data:")) {
    return new NextResponse("Imagem não encontrada", { status: 404 });
  }

  const separador = product.image.indexOf(",");
  const cabecalho = product.image.slice(5, separador); // ex: image/jpeg;base64
  const dados = product.image.slice(separador + 1);

  if (!cabecalho.includes("base64")) {
    return new NextResponse("Formato de imagem não suportado", { status: 415 });
  }

  const bytes = Buffer.from(dados, "base64");
  const tipo = cabecalho.split(";")[0] || "image/jpeg";

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": tipo,
      "Content-Length": String(bytes.byteLength),
      // Uma hora no navegador; se a foto for trocada no painel, some do
      // cache logo. O resto do tempo continua servindo sem custo.
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
