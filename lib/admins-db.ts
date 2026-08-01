/**
 * Fonte de dados dos usuários do painel — Firestore, coleção "admins".
 * Guarda só os metadados (nome/email/data) de quem pode logar; a senha
 * de verdade fica no Firebase Authentication, não aqui.
 *
 * Este arquivo só roda no servidor (Server Components, API routes).
 */
import "server-only";
import { adminDb } from "@/lib/firebase-admin";

const COLLECTION = "admins";

export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
}

export async function getAllAdmins(): Promise<AdminUser[]> {
  const snapshot = await adminDb.collection(COLLECTION).orderBy("createdAt").get();
  return snapshot.docs.map((doc) => doc.data() as AdminUser);
}

export async function countAdmins(): Promise<number> {
  const snapshot = await adminDb.collection(COLLECTION).count().get();
  return snapshot.data().count;
}

export async function createAdminRecord(admin: AdminUser): Promise<void> {
  await adminDb.collection(COLLECTION).doc(admin.uid).set(admin);
}

export async function deleteAdminRecord(uid: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(uid).delete();
}
