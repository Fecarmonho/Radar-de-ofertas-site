# 🔥 Configurando o Firebase (painel de admin)

Guia passo a passo pra deixar o painel `/admin` funcionando. Leva uns
15 minutos, é tudo gratuito no plano free do Firebase (Spark) pro
tamanho desse projeto.

---

## 1. Criar o projeto no Firebase

1. Acesse **console.firebase.google.com**
2. **Adicionar projeto** → dê um nome (ex: `radar-de-ofertas`) → pode
   desativar o Google Analytics do projeto (não precisa, já usamos o
   GA4 separado do site)
3. Aguarde o projeto ser criado

## 2. Ativar login por email/senha

1. No menu lateral: **Build → Authentication**
2. Aba **Sign-in method** → clique em **Email/senha** → ative → salvar

## 3. Criar o usuário do seu amigo

1. Ainda em Authentication, aba **Users** → **Add user**
2. Coloque o email e uma senha provisória pra ele
3. Combine com ele trocar a senha depois (não tem tela de "esqueci
   minha senha" configurada agora — se precisar, me avise que eu
   adiciono)

## 4. Criar o banco de dados (Firestore)

1. No menu lateral: **Build → Firestore Database**
2. **Criar banco de dados** → modo **produção** → escolha uma região
   (ex: `southamerica-east1` — São Paulo, fica mais rápido pro Brasil)
3. Pronto, banco criado (vazio por enquanto)

## 5. Pegar as chaves públicas (app cliente)

1. Ícone de engrenagem (canto superior esquerdo) → **Configurações do
   projeto**
2. Aba **Geral** → role até "Seus apps" → clique no ícone `</>` (Web)
3. Dê um apelido (ex: `radar-web`) → **Registrar app**
4. Vai aparecer um bloco `firebaseConfig` — copie os valores para o
   seu `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=apiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=authDomain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=projectId
NEXT_PUBLIC_FIREBASE_APP_ID=appId
```

## 6. Pegar a chave secreta (Admin SDK)

1. Ainda em **Configurações do projeto** → aba **Contas de serviço**
2. **Gerar nova chave privada** → confirma → baixa um arquivo `.json`
3. Abra esse arquivo e copie 3 campos pro seu `.env.local`:

```
FIREBASE_PROJECT_ID=project_id (do json)
FIREBASE_CLIENT_EMAIL=client_email (do json)
FIREBASE_PRIVATE_KEY="private_key (do json, com as aspas e os \n)"
```

⚠️ **Nunca** suba esse arquivo `.json` pro GitHub nem coloque a chave
privada em variável `NEXT_PUBLIC_*` — ela dá acesso total ao banco.
O `.gitignore` do projeto já ignora `.env*.local`, então tá seguro
desde que você não cole a chave em nenhum outro lugar.

## 7. Travar as regras do Firestore

Como todo acesso de escrita passa pelo servidor (Admin SDK, que
ignora as regras), pode deixar o Firestore fechado pra leitura/escrita
direta do navegador. Em **Firestore Database → Regras**, use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 8. Popular com os produtos de exemplo (opcional)

Com o `.env.local` preenchido:

```bash
npm run seed
```

## 9. Rodar localmente

```bash
npm install
npm run dev
```

- Site: http://localhost:3000
- Painel: http://localhost:3000/admin/login (entre com o email/senha
  que você criou no passo 3)

## 10. Deploy na Vercel

Configure as mesmas variáveis do `.env.local` em **Project Settings →
Environment Variables** na Vercel. Atenção especial ao
`FIREBASE_PRIVATE_KEY`: cole o valor inteiro, incluindo as quebras de
linha `\n` como estão no arquivo — a Vercel lida bem com isso.
