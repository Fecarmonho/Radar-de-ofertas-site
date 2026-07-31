// Preenche automaticamente as 3 variáveis do Firebase Admin no .env.local
// a partir do arquivo .json baixado no Firebase Console, sem precisar
// copiar/colar nada na mão.
//
// Como usar (Windows, dentro da pasta do projeto):
//   node scripts/setup-firebase-env.mjs "C:\Users\SEU_USUARIO\Downloads\NOME_DO_ARQUIVO.json"
//
// (dica: digite `node scripts/setup-firebase-env.mjs "` com a aspa aberta,
// depois arraste o arquivo .json da pasta Downloads pra dentro da janela
// do cmd — ele completa o caminho sozinho — e feche a aspa)

import fs from "node:fs";
import path from "node:path";

const jsonPath = process.argv[2];

if (!jsonPath) {
  console.error(
    "Uso: node scripts/setup-firebase-env.mjs \"caminho\\para\\o\\arquivo.json\""
  );
  process.exit(1);
}

if (!fs.existsSync(jsonPath)) {
  console.error(`Arquivo não encontrado: ${jsonPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const { project_id: projectId, client_email: clientEmail, private_key: privateKey } =
  serviceAccount;

if (!projectId || !clientEmail || !privateKey) {
  console.error("O arquivo não parece ser uma chave de conta de serviço do Firebase válida.");
  process.exit(1);
}

const envPath = path.resolve(process.cwd(), ".env.local");
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

// Escreve a chave privada como uma única linha, com \n literal (é assim
// que o Next.js e a Vercel esperam essa variável).
const privateKeyEscaped = privateKey.replace(/\n/g, "\\n");

const updates = {
  FIREBASE_PROJECT_ID: projectId,
  FIREBASE_CLIENT_EMAIL: clientEmail,
  FIREBASE_PRIVATE_KEY: `"${privateKeyEscaped}"`,
};

for (const [key, value] of Object.entries(updates)) {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, line);
  } else {
    envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + line + "\n";
  }
}

fs.writeFileSync(envPath, envContent);

console.log("✔ .env.local atualizado com as credenciais do Firebase Admin.");
console.log(`  Projeto: ${projectId}`);
console.log(`  Conta:   ${clientEmail}`);
console.log("\nAgora pode apagar o arquivo .json baixado — não precisa mais dele.");
