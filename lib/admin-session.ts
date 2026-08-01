import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { isAdminUid } from "@/lib/admins-db";

export const SESSION_COOKIE = "__session";

/**
 * Retorna os dados do usuário logado, ou null se não houver sessão válida.
 *
 * Não basta o cookie ser uma sessão legítima do Firebase: a chave pública
 * do projeto está no navegador, então qualquer pessoa consegue criar uma
 * conta no Firebase Authentication por conta própria. O que dá acesso ao
 * painel é estar na coleção "admins" do Firestore, que só o próprio painel
 * escreve (veja /api/admin/users e /api/admin/bootstrap).
 */
export async function getAdminSession() {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    // `true` = confere revogação (ex: se você desativar o usuário no console do Firebase)
    const session = await adminAuth.verifySessionCookie(cookie, true);
    if (!(await isAdminUid(session.uid))) return null;
    return session;
  } catch {
    return null;
  }
}
