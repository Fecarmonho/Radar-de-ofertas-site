import { AnuncioDestino, AnuncioEstilo, ProdutoAnuncio, SugestaoTexto } from "./types";

/**
 * Geração de gancho, texto secundário, legenda e hashtags a partir dos
 * dados do produto — sem IA, por regra/template. Função pura (sem I/O),
 * por isso roda direto no navegador, no clique de "Sugerir textos".
 */

function pick<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

function truncar(texto: string | undefined, max: number): string {
  if (!texto) return "";
  return texto.length > max ? `${texto.slice(0, max - 1).trim()}…` : texto;
}

const BENEFICIO_POR_CATEGORIA: Record<string, string> = {
  eletronicos: "Facilita o dia a dia",
  casa: "Deixa a casa em ordem",
  beleza: "Cuida de você todo dia",
  moda: "Fecha qualquer look",
  outros: "Resolve na hora",
};

function gerarGanchoETexto(
  produto: ProdutoAnuncio,
  estilo: AnuncioEstilo
): { gancho: string; textoSecundario: string } {
  const titulo = truncar(produto.title, 42) || "Achado da vez";
  const preco = produto.price ?? "";

  switch (estilo) {
    case "clean":
      return {
        gancho: titulo,
        textoSecundario: preco ? `A partir de ${preco}` : "Veja o preço no link",
      };

    case "gancho-forte":
      return {
        gancho: pick([
          "Isso aqui tá quase de graça",
          "Corre que essa promoção não dura",
          "Achei o achado do mês",
          "Gente, olha esse preço",
          "Para tudo e olha isso",
        ]),
        textoSecundario: preco ? `${titulo} por ${preco}` : titulo,
      };

    case "beneficio": {
      const beneficio =
        produto.benefit?.trim() ||
        BENEFICIO_POR_CATEGORIA[produto.category ?? "outros"] ||
        BENEFICIO_POR_CATEGORIA.outros;
      return {
        gancho: beneficio,
        textoSecundario: titulo,
      };
    }

    case "ugc-review": {
      const prova = produto.rating
        ? `${produto.rating.toFixed(1).replace(".", ",")}★ de quem já comprou`
        : produto.reviewCount
          ? `${produto.reviewCount}+ avaliações`
          : "Recomendo de olhos fechados";
      return {
        gancho: pick(["Testei e amei", "Comprei e não me arrependi", "Vale cada centavo"]),
        textoSecundario: prova,
      };
    }
  }
}

const HASHTAGS_CATEGORIA: Record<string, string[]> = {
  eletronicos: ["#eletronicos", "#tech", "#gadget"],
  casa: ["#casa", "#decoracao", "#organizacao"],
  beleza: ["#beleza", "#skincare", "#autocuidado"],
  moda: ["#moda", "#look", "#estilo"],
  outros: ["#achadinho", "#promo"],
};

const HASHTAGS_DESTINO: Record<AnuncioDestino, string[]> = {
  "shopee-video": ["#shopeevideo", "#shopee", "#achadinhosdashopee"],
  pinterest: ["#pinterest", "#inspiracao", "#ideias"],
};

const HASHTAGS_GENERICAS = ["#achadinho", "#promocao", "#oferta", "#vempravaler"];

export function gerarHashtags(produto: ProdutoAnuncio, destino: AnuncioDestino): string[] {
  const todas = [
    ...(HASHTAGS_CATEGORIA[produto.category ?? "outros"] ?? HASHTAGS_CATEGORIA.outros),
    ...HASHTAGS_DESTINO[destino],
    ...HASHTAGS_GENERICAS,
  ];
  return Array.from(new Set(todas)).slice(0, 12);
}

/**
 * Monta a legenda a partir do gancho e texto secundário *atuais* do
 * formulário — que podem ter sido editados à mão depois de "Sugerir
 * textos" — por isso recebe os dois como parâmetro em vez de gerá-los de novo.
 */
export function montarLegenda(
  produto: ProdutoAnuncio,
  destino: AnuncioDestino,
  gancho: string,
  textoSecundario: string
): string {
  const linhas = [gancho];
  if (produto.title && produto.title !== gancho) linhas.push(produto.title);
  if (textoSecundario && textoSecundario !== produto.title) linhas.push(textoSecundario);
  if (produto.price) linhas.push(`💰 ${produto.price}`);
  linhas.push(
    destino === "pinterest"
      ? "Salve esse pin e veja mais no link 📌"
      : "Link nos comentários / bio 🔗"
  );
  return linhas.join("\n");
}

export function gerarSugestaoTexto(
  produto: ProdutoAnuncio,
  estilo: AnuncioEstilo,
  destino: AnuncioDestino
): SugestaoTexto {
  const { gancho, textoSecundario } = gerarGanchoETexto(produto, estilo);
  const hashtags = gerarHashtags(produto, destino);
  const legenda = montarLegenda(produto, destino, gancho, textoSecundario);
  return { gancho, textoSecundario, legenda, hashtags };
}
