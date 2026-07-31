// Importa os produtos de exemplo para o Firestore, uma única vez.
//
// Rodar com:
//   node --env-file=.env.local scripts/seed-products.mjs
//
// (precisa do Node 20.6+ pro --env-file funcionar; se der erro, exporte
// as variáveis do .env.local manualmente antes de rodar o script)

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Faltam variáveis do Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, " +
      "FIREBASE_PRIVATE_KEY). Confira seu .env.local — veja SETUP-FIREBASE.md."
  );
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

// Mesmo conteúdo de data/products.ts, duplicado aqui pra não depender
// de compilar TypeScript só pra rodar este script único.
const seedProducts = [
  {
    slug: "fone-bluetooth-tws-x1",
    title: "Fone de Ouvido Bluetooth TWS X1",
    shortDescription:
      "Fone sem fio com cancelamento de ruído, bateria de 30h e estojo de recarga.",
    image: "/placeholder-produto.svg",
    price: "R$ 89,90",
    category: "eletronicos",
    network: "shopee",
    networkProductId: "https://s.shopee.com.br/SEU_LINK_AQUI",
    brand: "Genérico",
    rating: 4.6,
    reviewCount: 3200,
  },
  {
    slug: "mouse-gamer-rgb-m5",
    title: "Mouse Gamer RGB M5",
    shortDescription: "6400 DPI ajustável, iluminação RGB e 6 botões programáveis.",
    image: "/placeholder-produto.svg",
    price: "R$ 129,00",
    category: "eletronicos",
    network: "shopee",
    networkProductId: "https://s.shopee.com.br/SEU_LINK_AQUI",
    brand: "Marca X",
    rating: 4.5,
    reviewCount: 810,
  },
  {
    slug: "cadeira-escritorio-ergo",
    title: "Cadeira de Escritório Ergonômica",
    shortDescription: "Apoio lombar ajustável, braços reguláveis e base giratória 360°.",
    image: "/placeholder-produto.svg",
    price: "R$ 449,00",
    category: "casa",
    network: "shopee",
    networkProductId: "https://s.shopee.com.br/SEU_LINK_AQUI",
    brand: "Marca Y",
    rating: 4.4,
    reviewCount: 512,
  },
];

for (const product of seedProducts) {
  await db.collection("products").doc(product.slug).set(product);
  console.log(`✔ ${product.slug}`);
}

console.log(`\nPronto — ${seedProducts.length} produtos importados para o Firestore.`);
process.exit(0);
