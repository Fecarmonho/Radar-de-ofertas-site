import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

export const SESSION_COOKIE = "__session";

/** Retorna os dados do usuário logado, ou null se não houver sessão válida. */
export async function getAdminSession() {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    // `true` = confere revogação (ex: se você desativar o usuário no console do Firebase)
    return await adminAuth.verifySessionCookie(cookie, true);
  } catch {
    return null;
  }
}
