/**
 * Firebase no lado do navegador — usado só na tela de login do admin
 * (app/admin/login/page.tsx) pra autenticar com email/senha.
 *
 * Essas chaves são públicas por natureza (ficam visíveis no navegador),
 * a segurança de verdade acontece no servidor (veja lib/firebase-admin.ts
 * e o cookie de sessão validado em cada rota /admin e /api/admin/*).
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
