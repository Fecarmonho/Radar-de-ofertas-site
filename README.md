# Afiliado Starter — Shopee

Base técnica para rodar campanhas de afiliado com landing page própria,
tracking de clique server-side e pronto pra plugar Google Ads.

## Como está organizado

```
lib/affiliates.ts        -> abstração das redes (adicionar rede nova = editar só este arquivo)
data/products.ts          -> seus produtos (troque por CMS/planilha quando escalar)
app/api/go/[slug]/route.ts -> bridge de tracking: loga o clique e redireciona pro link de afiliado
app/produtos/[slug]/      -> página de review de cada produto (SEO + Ads)
app/page.tsx               -> home listando os produtos
components/Analytics.tsx  -> GA4
```

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha seus IDs de afiliado
npm run dev
```

Abra http://localhost:3000

## Deploy na Vercel

```bash
npm i -g vercel
vercel
```

Depois configure as mesmas variáveis do `.env.example` em
Project Settings > Environment Variables no painel da Vercel.

## Por que existe um endpoint `/api/go/:slug` em vez de linkar direto?

1. **Política do Google Ads**: a URL final do anúncio geralmente não pode
   ser um link de afiliado puro. Precisa ser uma página com conteúdo real
   (esta landing page é isso).
2. **Termos da Shopee**: pede que o link de afiliado não seja promovido
   diretamente em anúncios pagos sem uma camada de conteúdo no meio.
3. **Medição confiável**: registrar o clique no servidor (dentro da rota
   `/api/go`) não depende de JavaScript no navegador nem é afetado por
   bloqueadores de anúncio, então seus números de conversão ficam mais
   próximos da realidade do que se você medisse só no cliente.

## Próximos passos sugeridos

- Trocar `data/products.ts` por uma fonte editável (Google Sheets API é o
  mais simples pra começar, sem precisar de banco de dados).
- Trocar o `console.log` de `logClick` por gravação em banco (Supabase é
  rápido de configurar) para ter um painel próprio de cliques por produto
  e por origem de tráfego.
- Adicionar UTM parsing na home (`?utm_campaign=...`) e propagar isso pro
  parâmetro `src` do link de tracking, pra saber exatamente qual anúncio
  gerou qual clique.
- Cadastrar o domínio da Vercel nas plataformas de afiliado como canal de
  divulgação (algumas pedem aprovação do site).
- Ligar o Google Ads Conversion Tracking na rota `/api/go` (ou via GA4 +
  Google Ads linkado) pra otimizar campanha por conversão, não só por
  clique.
