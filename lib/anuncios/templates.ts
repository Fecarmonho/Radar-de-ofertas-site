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

/**
 * Palavras comuns demais para virar hashtag ("Kit 2 Unidades Sérum Facial"
 * não deve virar #kit #2 #unidades). Curta de propósito — é melhor deixar
 * passar uma palavra fraca do que cortar uma palavra-chave de verdade.
 */
const PALAVRAS_IGNORADAS = new Set([
  "de", "da", "do", "das", "dos", "e", "ou", "com", "sem", "para", "por",
  "em", "no", "na", "nos", "nas", "um", "uma", "uns", "umas", "o", "a",
  "os", "as", "kit", "und", "unidade", "unidades", "pacote", "novo", "nova",
]);

const MARCAS_DIACRITICAS = new RegExp("[̀-ͯ]", "g");

/**
 * Tira as palavras mais relevantes do nome do produto pra virar hashtag —
 * é isso que faz a legenda achar quem já está buscando aquele produto
 * específico, e não só a categoria genérica.
 */
function extrairPalavrasChave(titulo: string | undefined, max = 3): string[] {
  if (!titulo) return [];

  const palavras = titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(MARCAS_DIACRITICAS, "")
    .split(/[^a-z0-9]+/)
    .filter((palavra) => palavra.length > 2 && !/^\d+$/.test(palavra) && !PALAVRAS_IGNORADAS.has(palavra));

  const vistas = new Set<string>();
  const hashtags: string[] = [];
  for (const palavra of palavras) {
    if (vistas.has(palavra)) continue;
    vistas.add(palavra);
    hashtags.push(`#${palavra}`);
    if (hashtags.length >= max) break;
  }
  return hashtags;
}

export function gerarHashtags(produto: ProdutoAnuncio, destino: AnuncioDestino): string[] {
  const todas = [
    ...extrairPalavrasChave(produto.title),
    ...(HASHTAGS_CATEGORIA[produto.category ?? "outros"] ?? HASHTAGS_CATEGORIA.outros),
    ...HASHTAGS_DESTINO[destino],
    ...HASHTAGS_GENERICAS,
  ];
  return Array.from(new Set(todas)).slice(0, 15);
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

/**
 * Prompts para ferramentas de IA externas (GPT pra imagem, Veo/Gemini pra
 * vídeo) — texto sugerido pra copiar e colar lá, editável antes de usar.
 * Nada aqui chama nenhuma API de IA, é só montagem de texto por regra,
 * igual ao gancho/legenda/hashtags acima.
 */
function tomPorEstilo(estilo: AnuncioEstilo): string {
  switch (estilo) {
    case "clean":
      return "still de produto minimalista, sem modelo, fundo liso e sombra suave";
    case "gancho-forte":
      return "cena dinâmica, sensação de urgência/oferta, cores vibrantes";
    case "beneficio":
      return "mostrando o produto sendo usado no dia a dia, evidenciando o benefício principal";
    case "ugc-review":
      return "estilo caseiro e autêntico, como um vídeo gravado no celular, sem parecer profissional demais";
  }
}

export function gerarPromptImagem(
  produto: ProdutoAnuncio,
  estilo: AnuncioEstilo,
  modelo?: string
): string {
  const titulo = produto.title?.trim() || "o produto";
  const linhas = [
    `Melhore esta foto de "${titulo}", mantendo o produto real e reconhecível — não altere cor, formato, texto ou marca.`,
    `Estilo: ${tomPorEstilo(estilo)}.`,
  ];

  if (modelo?.trim()) {
    linhas.push(`Inclua um(a) modelo (${modelo.trim()}) usando ou segurando o produto, em pose natural.`);
  } else if (estilo !== "clean") {
    linhas.push("Inclua um(a) modelo usando ou segurando o produto, em pose natural.");
  }

  linhas.push("Iluminação de estúdio, fundo neutro, foco nítido no produto, proporção vertical 9:16.");
  return linhas.join("\n");
}

export function gerarPromptVideo(
  produto: ProdutoAnuncio,
  estilo: AnuncioEstilo,
  destino: AnuncioDestino,
  modelo?: string
): string {
  const titulo = produto.title?.trim() || "o produto";
  const linhas = [
    `Vídeo vertical 9:16, de 8 a 15 segundos, anunciando "${titulo}".`,
    `Estilo: ${tomPorEstilo(estilo)}.`,
  ];

  if (modelo?.trim()) {
    linhas.push(`Modelo: ${modelo.trim()}, aparece usando ou mostrando o produto.`);
  }

  linhas.push(
    destino === "pinterest"
      ? "Ritmo calmo, cenas inspiracionais, com um enquadramento bom pra pausar num frame só."
      : "Ritmo rápido, cortes dinâmicos, gancho visual já nos primeiros 2 segundos."
  );

  if (produto.price) {
    linhas.push(`Mostrar o preço "${produto.price}" em algum ponto do vídeo, como texto na tela.`);
  }

  linhas.push("Sem áudio de marca registrada nem logotipos de terceiros.");
  return linhas.join("\n");
}
