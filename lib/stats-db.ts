/**
 * Contadores de visita e de clique — Firestore, coleção "stats".
 *
 * Em vez de gravar uma linha por evento (que estoura a cota gratuita do
 * Firestore rapidinho e deixa o painel lento), guardamos **um documento
 * por dia** com contadores que só somam:
 *
 *   stats/2026-08-01 = {
 *     views: 320, clicks: 41,
 *     byPath:    { "/": 210, "/produtos/air-fryer": 110 },
 *     bySource:  { direto: 180, "google.com": 90, "ads-verao": 50 },
 *     byProduct: { "air-fryer": 30, "fone-bluetooth": 11 },
 *   }
 *
 * Assim o painel de 30 dias custa 30 leituras, e cada visita custa uma
 * escrita só. O dia usa o fuso de São Paulo, senão a virada do dia
 * apareceria às 21h.
 */
import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

const COLLECTION = "stats";

export interface DayStats {
  date: string;
  views: number;
  clicks: number;
  byPath: Record<string, number>;
  bySource: Record<string, number>;
  byProduct: Record<string, number>;
}

/** Data no formato AAAA-MM-DD, no fuso de São Paulo. */
export function dayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Lista das últimas N datas, da mais antiga para a mais recente. */
export function lastDayKeys(days: number): string[] {
  const keys: string[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(now - i * 24 * 60 * 60 * 1000)));
  }
  return keys;
}

export async function recordPageView(view: {
  path: string;
  source: string;
}): Promise<void> {
  await adminDb
    .collection(COLLECTION)
    .doc(dayKey())
    .set(
      {
        date: dayKey(),
        views: FieldValue.increment(1),
        byPath: { [safeKey(view.path)]: FieldValue.increment(1) },
        bySource: { [safeKey(view.source)]: FieldValue.increment(1) },
      },
      { merge: true }
    );
}

export async function recordClick(click: {
  slug: string;
  source: string;
}): Promise<void> {
  await adminDb
    .collection(COLLECTION)
    .doc(dayKey())
    .set(
      {
        date: dayKey(),
        clicks: FieldValue.increment(1),
        byProduct: { [safeKey(click.slug)]: FieldValue.increment(1) },
        bySource: { [safeKey(click.source)]: FieldValue.increment(1) },
      },
      { merge: true }
    );
}

/** Lê os últimos N dias de uma vez só (dias sem movimento voltam zerados). */
export async function getRecentStats(days: number): Promise<DayStats[]> {
  const keys = lastDayKeys(days);
  const refs = keys.map((key) => adminDb.collection(COLLECTION).doc(key));
  const docs = await adminDb.getAll(...refs);

  return docs.map((doc, i) => {
    const data = doc.data() ?? {};
    return {
      date: keys[i],
      views: numberOf(data.views),
      clicks: numberOf(data.clicks),
      byPath: mapOf(data.byPath),
      bySource: mapOf(data.bySource),
      byProduct: mapOf(data.byProduct),
    };
  });
}

/** Soma os contadores de um período. */
export function totalsOf(stats: DayStats[]) {
  return stats.reduce(
    (acc, day) => ({ views: acc.views + day.views, clicks: acc.clicks + day.clicks }),
    { views: 0, clicks: 0 }
  );
}

/** Junta um dos mapas (produto/origem/página) de vários dias e ordena. */
export function rankOf(
  stats: DayStats[],
  field: "byProduct" | "bySource" | "byPath"
): { key: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const day of stats) {
    for (const [key, value] of Object.entries(day[field])) {
      totals.set(key, (totals.get(key) ?? 0) + value);
    }
  }
  return [...totals.entries()]
    .map(([key, total]) => ({ key, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Chaves de mapa no Firestore não aceitam qualquer caractere, e um
 * visitante pode mandar qualquer coisa no endereço. Deixamos passar só o
 * que é legível e cortamos o tamanho.
 */
function safeKey(raw: string): string {
  const clean = (raw || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return clean || "outros";
}

function numberOf(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mapOf(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const result: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const n = numberOf(raw);
    if (n > 0) result[key] = n;
  }
  return result;
}
