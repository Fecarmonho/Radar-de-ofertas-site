/**
 * Estado do site — Firestore, documento "settings/site".
 *
 * Serve para tirar o site do ar sem mexer na Vercel: o dono liga e desliga
 * pelo painel, e o /admin continua funcionando nos três estados (é outro
 * grupo de rotas, não passa pelo layout do site).
 *
 *   no ar      → site normal
 *   construção → site normal, com uma tarja no topo avisando que ainda
 *                está sendo montado
 *   manutenção → o site inteiro é substituído por um aviso; só o painel
 *                continua acessível
 *
 * O texto de cada modo fica guardado separado, então dá para deixar a
 * mensagem de manutenção pronta sem precisar tirar o site do ar para
 * escrevê-la.
 *
 * Este arquivo só roda no servidor.
 */
import "server-only";
import { adminDb } from "@/lib/firebase-admin";

const COLLECTION = "settings";
const DOC = "site";

export const SITE_STATES = ["ok", "construcao", "manutencao"] as const;
export type SiteState = (typeof SITE_STATES)[number];

/** Os dois estados que mostram aviso ao visitante. */
export type SiteAviso = Exclude<SiteState, "ok">;

export interface Texto {
  title: string;
  message: string;
}

export interface SiteStatus {
  state: SiteState;
  textos: Record<SiteAviso, Texto>;
  /** ISO de quando o estado mudou pela última vez (null = nunca mexeram) */
  updatedAt: string | null;
  /** E-mail de quem mexeu, para não sobrar dúvida com mais de um admin */
  updatedBy: string | null;
}

export const TEXTO_PADRAO: Record<SiteAviso, Texto> = {
  construcao: {
    title: "Site em construção",
    message:
      "Ainda estamos montando o catálogo. As ofertas que já estão aqui são reais e funcionam normalmente.",
  },
  manutencao: {
    title: "Estamos em manutenção",
    message:
      "O site volta em instantes. Obrigado pela paciência!",
  },
};

export function isSiteState(value: unknown): value is SiteState {
  return SITE_STATES.includes(value as SiteState);
}

/**
 * Lê o estado atual.
 *
 * Se o Firestore falhar, devolve "no ar" de propósito: uma instabilidade
 * momentânea do banco não pode derrubar o site inteiro. O erro certo aqui
 * é errar para o lado de deixar no ar.
 */
export async function getSiteStatus(): Promise<SiteStatus> {
  try {
    const doc = await adminDb.collection(COLLECTION).doc(DOC).get();
    const data = doc.data() ?? {};

    return {
      state: isSiteState(data.state) ? data.state : "ok",
      textos: {
        construcao: textoOf(data.construcao, TEXTO_PADRAO.construcao),
        manutencao: textoOf(data.manutencao, TEXTO_PADRAO.manutencao),
      },
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null,
      updatedBy: typeof data.updatedBy === "string" ? data.updatedBy : null,
    };
  } catch {
    return {
      state: "ok",
      textos: TEXTO_PADRAO,
      updatedAt: null,
      updatedBy: null,
    };
  }
}

export async function saveSiteStatus(
  data: { state: SiteState; textos: Record<SiteAviso, Texto> },
  updatedBy: string
): Promise<void> {
  await adminDb
    .collection(COLLECTION)
    .doc(DOC)
    .set({
      state: data.state,
      construcao: data.textos.construcao,
      manutencao: data.textos.manutencao,
      updatedAt: new Date().toISOString(),
      updatedBy,
    });
}

/** Corta o texto no limite do que cabe bonito na tela de aviso. */
export function limparTexto(valor: unknown, padrao: Texto): Texto {
  const obj = (valor ?? {}) as Record<string, unknown>;
  return {
    title: recorte(obj.title, 70) || padrao.title,
    message: recorte(obj.message, 240) || padrao.message,
  };
}

function textoOf(valor: unknown, padrao: Texto): Texto {
  if (!valor || typeof valor !== "object") return padrao;
  return limparTexto(valor, padrao);
}

function recorte(valor: unknown, limite: number): string {
  if (typeof valor !== "string") return "";
  return valor.trim().slice(0, limite);
}
