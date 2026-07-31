/**
 * Fonte de dados das seções — Firestore, coleção "sections".
 * Usa o slug como ID do documento, igual products-db.ts.
 *
 * Este arquivo só roda no servidor (Server Components, API routes).
 */
import "server-only";
import { adminDb } from "@/lib/firebase-admin";
import { Section } from "@/lib/affiliates";

const COLLECTION = "sections";

export async function getAllSections(): Promise<Section[]> {
  const snapshot = await adminDb.collection(COLLECTION).orderBy("order").get();
  return snapshot.docs.map((doc) => doc.data() as Section);
}

export async function getSectionBySlug(slug: string): Promise<Section | undefined> {
  const doc = await adminDb.collection(COLLECTION).doc(slug).get();
  return doc.exists ? (doc.data() as Section) : undefined;
}

/** Cria uma seção nova. Lança erro se o slug já existir. */
export async function createSection(section: Omit<Section, "order">): Promise<void> {
  const ref = adminDb.collection(COLLECTION).doc(section.slug);
  const existing = await ref.get();
  if (existing.exists) {
    throw new Error(`Já existe uma seção com o slug "${section.slug}".`);
  }

  // Nova seção sempre entra no final da lista.
  const snapshot = await adminDb.collection(COLLECTION).get();
  const order = snapshot.size;

  await ref.set({ ...section, order });
}

/** Atualiza uma seção existente pelo slug atual. */
export async function updateSection(
  currentSlug: string,
  section: Section
): Promise<void> {
  if (section.slug !== currentSlug) {
    const oldRef = adminDb.collection(COLLECTION).doc(currentSlug);
    const newRef = adminDb.collection(COLLECTION).doc(section.slug);
    const newExists = await newRef.get();
    if (newExists.exists) {
      throw new Error(`Já existe uma seção com o slug "${section.slug}".`);
    }
    await newRef.set(section);
    await oldRef.delete();
    return;
  }
  await adminDb.collection(COLLECTION).doc(currentSlug).set(section);
}

export async function deleteSection(slug: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(slug).delete();
}
