/**
 * Fotos do carrossel da home — Firestore, coleção "banners".
 *
 * O carrossel tem quatro faixas: as duas primeiras são fixas no código
 * (a da logo e a da ilustração 3D) e as duas últimas são estes espaços,
 * que você troca pelo painel. Espaço vazio não deixa buraco: o
 * carrossel volta a mostrar a faixa padrão daquele lugar.
 *
 * Este arquivo só roda no servidor.
 */
import "server-only";
import { adminDb } from "@/lib/firebase-admin";

const COLLECTION = "banners";

/** Quantos espaços de foto existem no carrossel. */
export const BANNER_SLOTS = [1, 2] as const;
export type BannerSlot = (typeof BANNER_SLOTS)[number];

export interface Banner {
  slot: BannerSlot;
  /** Foto em base64 (comprimida no navegador antes de subir) */
  image: string;
  /** Frase principal da faixa. Vazio = a foto aparece sozinha, maior. */
  title?: string;
  /** Linha de apoio embaixo da frase */
  description?: string;
  /** Texto do botão. Só aparece se houver link. */
  ctaLabel?: string;
  /** Para onde o clique leva. Vazio = faixa sem link. */
  link?: string;
  /** Descrição da imagem, para leitores de tela e quando a foto não carrega */
  alt?: string;
  updatedAt: string;
}

export function isBannerSlot(value: unknown): value is BannerSlot {
  return BANNER_SLOTS.includes(Number(value) as BannerSlot);
}

export async function getBanners(): Promise<Banner[]> {
  const refs = BANNER_SLOTS.map((slot) =>
    adminDb.collection(COLLECTION).doc(String(slot))
  );
  const docs = await adminDb.getAll(...refs);

  return docs
    .filter((doc) => doc.exists)
    .map((doc) => doc.data() as Banner)
    .filter((banner) => Boolean(banner.image));
}

export async function saveBanner(
  slot: BannerSlot,
  data: {
    image: string;
    title?: string;
    description?: string;
    ctaLabel?: string;
    link?: string;
    alt?: string;
  }
): Promise<void> {
  await adminDb
    .collection(COLLECTION)
    .doc(String(slot))
    .set({
      slot,
      image: data.image,
      title: data.title?.trim() || undefined,
      description: data.description?.trim() || undefined,
      ctaLabel: data.ctaLabel?.trim() || undefined,
      link: data.link?.trim() || undefined,
      alt: data.alt?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
}

export async function deleteBanner(slot: BannerSlot): Promise<void> {
  await adminDb.collection(COLLECTION).doc(String(slot)).delete();
}
