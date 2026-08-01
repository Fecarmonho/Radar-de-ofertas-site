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

## 2. Ativar login por email/senha (e fechar o auto-cadastro)

1. No menu lateral: **Build → Authentication**
2. Aba **Sign-in method** → clique em **Email/senha** → ative → salvar
3. Ainda em **Sign-in method**, role até **Configurações avançadas** e
   marque **Impedir inscrição por meio de e-mail/senha** (em inglês:
   *Prevent sign-up with email/password*)

⚠️ O passo 3 importa: a chave `NEXT_PUBLIC_FIREBASE_API_KEY` fica
visível no navegador (é assim mesmo), e com o auto-cadastro ligado
qualquer pessoa consegue criar uma conta no seu projeto pela API do
Firebase. O painel já barra quem não está na coleção `admins`, mas
desligar o auto-cadastro fecha a porta antes ainda.

## 3. Criar o usuário do seu amigo

O jeito certo é **pelo próprio painel**: entre em `/admin` com a sua
conta e vá em **Usuários → Novo**. Assim ele é criado no Firebase
Authentication **e** registrado na coleção `admins` — que é o que
libera o acesso.

Se você criar o usuário direto pelo console do Firebase
(Authentication → Users → Add user), ele vai conseguir digitar a senha
certa mas receber *"Essa conta não tem acesso ao painel"*, porque falta
o registro na coleção `admins` (veja a seção de problemas no fim).

Não existe tela de "esqueci minha senha" configurada agora — se
precisar, dá pra adicionar depois.

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

## Quem pode entrar no painel

Ter conta no Firebase Authentication **não** dá acesso ao painel. O que
libera é existir um documento na coleção `admins` do Firestore com o
ID igual ao **UID** do usuário. Isso é checado em toda página `/admin` e
em toda rota `/api/admin/*` (veja `lib/admin-session.ts`).

Quem cria esse documento é o próprio painel: a tela de primeiro acesso
(`/admin/login`, quando ainda não existe nenhum admin) e a tela
**Usuários → Novo**.

### "Digitei a senha certa e não entra"

A mensagem *"Essa conta não tem acesso ao painel"* quer dizer que o
usuário existe no Authentication mas não tem registro em `admins` —
normalmente porque foi criado à mão pelo console. Para consertar:

1. **Authentication → Users** → copie o **UID** do usuário
2. **Firestore Database → Dados** → coleção `admins` → **Adicionar
   documento**
3. Em "ID do documento", cole o UID
4. Adicione os campos (todos do tipo *string*):
   - `uid` → o mesmo UID
   - `name` → nome da pessoa
   - `email` → email dela
   - `createdAt` → a data de hoje, ex: `2026-08-01T12:00:00.000Z`
5. Salvar e tentar entrar de novo

## Sobre as fotos dos produtos

As fotos cadastradas no painel são comprimidas no próprio navegador e
guardadas como texto (base64) direto no produto, dentro do Firestore
— não usa o Firebase Storage, então **não precisa do plano Blaze**
nem de cartão cadastrado. O Firestore free (Spark) é suficiente pro
tamanho desse projeto.
