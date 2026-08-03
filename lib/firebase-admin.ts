/**
 * Firebase no lado do servidor — NUNCA importe este arquivo de um
 * componente cliente ("use client"). Usa a chave secreta da conta de
 * serviço pra ler/escrever no Firestore e validar sessões de login,
 * ignorando as regras de segurança do Firestore (por isso é o próprio
 * código do servidor que decide quem pode ler/escrever, checando o
 * cookie de sessão antes de cada operação).
 */
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function initAdmin() {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // No painel da Vercel a quebra de linha da chave privada vira "\n"
  // literal — precisamos converter de volta para quebra de linha real.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Variáveis do Firebase Admin não configuradas. Confira FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no seu .env.local (veja SETUP-FIREBASE.md)."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const adminApp = initAdmin();
export const adminAuth = getAuth(adminApp);

/**
 * O build do Next avalia este módulo uma vez por rota, no mesmo processo.
 * `settings()` só aceita ser chamado uma vez por instância do Firestore —
 * na segunda rota o build quebrava com "Firestore has already been
 * initialized". Por isso a instância já configurada fica guardada no
 * escopo global do processo, e é reaproveitada por todas as rotas.
 */
const globalComCache = globalThis as typeof globalThis & {
  __radarFirestore?: Firestore;
};

function criarFirestore(): Firestore {
  const db = getFirestore(adminApp);
  // Campos opcionais que chegam como `undefined` (produto sem marca, sem
  // nota etc.) são simplesmente ignorados na gravação em vez de derrubar a
  // requisição inteira com erro.
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}

export const adminDb =
  globalComCache.__radarFirestore ??
  (globalComCache.__radarFirestore = criarFirestore());
