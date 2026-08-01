/**
 * Fonte de dados dos produtos — Firestore, coleção "products".
 * Usa o slug como ID do documento (fica fácil buscar por slug e evita
 * duas linguetas com slug repetido).
 *
 * Este arquivo só roda no servidor (Server Components, API routes).
 */
import "server-only";
import { adminDb } from "@/lib/firebase-admin";
import { Product } from "@/lib/affiliates";

const COLLECTION = "products";

export async function getAllProducts(): Promise<Product[]> {
  const snapshot = await adminDb.collection(COLLECTION).orderBy("title").get();
  return snapshot.docs.map((doc) => doc.data() as Product);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const doc = await adminDb.collection(COLLECTION).doc(slug).get();
  return doc.exists ? (doc.data() as Product) : undefined;
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where("category", "==", category)
    .get();
  return snapshot.docs.map((doc) => doc.data() as Product);
}

/** Cria um produto novo. Lança erro se o slug já existir. */
export async function createProduct(product: Product): Promise<void> {
  const ref = adminDb.collection(COLLECTION).doc(product.slug);
  const existing = await ref.get();
  if (existing.exists) {
    throw new Error(`Já existe um produto com o slug "${product.slug}".`);
  }
  await ref.set(product);
}

/** Atualiza um produto existente pelo slug atual. */
export async function updateProduct(
  currentSlug: string,
  product: Product
): Promise<void> {
  if (product.slug !== currentSlug) {
    // Slug mudou: precisa mover o documento (Firestore não permite
    // renomear o ID de um doc existente).
    const oldRef = adminDb.collection(COLLECTION).doc(currentSlug);
    const newRef = adminDb.collection(COLLECTION).doc(product.slug);
    const newExists = await newRef.get();
    if (newExists.exists) {
      throw new Error(`Já existe um produto com o slug "${product.slug}".`);
    }
    await newRef.set(product);
    await oldRef.delete();
    return;
  }
  await adminDb.collection(COLLECTION).doc(currentSlug).set(product);
}

/**
 * Grava só os campos de preço, sem tocar no resto do produto — é o que a
 * atualização automática diária usa.
 */
export async function updateProductPrice(
  slug: string,
  price: { price: string; priceValue: number; priceUpdatedAt: string }
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(slug).update(price);
}

/** Marca que o preço foi conferido, mesmo quando o valor não mudou. */
export async function touchPriceCheckedAt(
  slug: string,
  checkedAt: string
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(slug).update({ priceUpdatedAt: checkedAt });
}

export async function deleteProduct(slug: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(slug).delete();
}
