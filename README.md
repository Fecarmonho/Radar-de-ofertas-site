# Radar de Ofertas

Site de afiliado da Shopee com painel próprio: landing page pública,
cadastro de produtos, tracking de clique no servidor e métricas.

## Como está organizado

```
app/(site)/                  -> site público (home + página de cada produto)
app/admin/                   -> painel: produtos, seções, usuários, métricas
app/api/go/[slug]/           -> ponte de tracking: conta o clique e manda pra Shopee
app/api/track/view/          -> contador de visitas (chamado pelo próprio site)
app/api/cron/refresh-prices/ -> atualização diária dos preços
lib/firebase-admin.ts        -> Firestore/Auth no servidor (chave de serviço)
lib/products-db.ts           -> produtos (coleção "products")
lib/sections-db.ts           -> seções da home (coleção "sections")
lib/admins-db.ts             -> quem pode entrar no painel (coleção "admins")
lib/stats-db.ts              -> contadores de visita e clique (coleção "stats")
lib/site-status-db.ts        -> site no ar / em construção / fora do ar (doc "settings/site")
lib/scrape-shopee.ts         -> lê dados do produto a partir do link
lib/price-refresh.ts         -> rotina que confere os preços
lib/affiliates.ts            -> tipos e regras do link de afiliado
```

O navegador nunca fala com o Firestore: tudo passa pelo servidor com a
chave de serviço, e as regras do banco ficam fechadas. Configuração
passo a passo em [SETUP-FIREBASE.md](SETUP-FIREBASE.md).

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com os dados do seu Firebase
npm run dev
```

- Site: http://localhost:3000
- Painel: http://localhost:3000/admin

## Cadastrando um produto

Cole o link de afiliado (gerado em affiliate.shopee.com.br) e clique em
**Buscar dados**: o servidor abre a página do produto e traz nome, foto,
descrição, preço, nota e número de avaliações. Tudo é editável depois —
o que a Shopee não publicar fica em branco pra você preencher.

## Preço

O preço é conferido na Shopee **todo dia** (rota `/api/cron/refresh-prices`,
agendada em `vercel.json`) e também na hora, pelo botão "Atualizar preços
agora" no painel. Cada produto tem uma opção para ficar de fora da
atualização automática, e a página do produto mostra a data da última
conferida.

A rotina só aceita o preço que vem nos dados estruturados da página
(JSON-LD). Quando não encontra, mantém o valor antigo em vez de chutar.

**Produto com variação** (a Shopee mostra "R$ 16,99 - R$ 48,99"): não dá
para puxar a faixa. Os dados estruturados trazem um valor só, o da
variação mais barata — que é o que o site exibe, embaixo do rótulo "A
partir de". Se você preferir mostrar a faixa inteira, digite-a no campo
de preço: o sistema reconhece o formato e a atualização automática passa
longe daquele produto, preservando o que você escreveu.

## Carrossel da home

São quatro faixas. As duas primeiras são fixas no código (a da logo e a
da ilustração 3D, em `components/BannerCarousel.tsx`); as duas últimas
são espaços de foto que você troca em `/admin/carrossel`, com link e
descrição opcionais. Espaço vazio não deixa buraco: a faixa volta a
mostrar o conteúdo padrão daquele lugar.

## Métricas

`/admin/metricas` mostra visitas, cliques, taxa de clique, produtos mais
clicados e origem do tráfego. A contagem é feita no próprio servidor e
guardada como um documento por dia na coleção `stats` — por isso é barata
e não é bloqueada por bloqueador de anúncio, diferente do GA4 (que
continua funcionando em paralelo, se você configurar).

## Tirar o site do ar

`/admin/site` tem um interruptor com três posições, que vale na hora para
o site inteiro:

- **No ar** — normal.
- **Em construção** — o site continua navegável, com uma tarja laranja no
  topo de todas as páginas.
- **Fora do ar** — nenhuma página do site aparece: só o aviso de
  manutenção. O `robots.txt` passa a pedir que o Google não indexe
  enquanto durar, para ele não trocar o conteúdo já indexado pelo texto
  de manutenção.

O painel **não** sai do ar junto — é outro grupo de rotas e não passa
pelo layout do site. Dá para cadastrar produto com o site fora do ar e
só então colocá-lo no ar.

O texto dos dois avisos é editável na mesma tela, e cada um é guardado
separado: dá para deixar a mensagem de manutenção escrita hoje e só usar
no dia que precisar. Enquanto o site não estiver "no ar", o painel mostra
uma faixa em todas as páginas — o jeito de ninguém esquecer ligado.

As páginas do site ficam 60s em cache; por isso a rota que grava o estado
chama `revalidatePath("/", "layout")`, senão o botão levaria até um
minuto para fazer efeito.

Detalhe: os links `/api/go/:slug` já compartilhados continuam levando
para a Shopee mesmo com o site fora do ar. É de propósito — não expõe
nada do site e a comissão continua valendo.

## Deploy na Vercel

Configure as variáveis do `.env.example` em Project Settings > Environment
Variables. Além das do Firebase, defina `CRON_SECRET` — é a senha que a
Vercel usa para chamar a atualização diária de preços.

## Por que existe `/api/go/:slug` em vez de linkar direto

1. **Política do Google Ads**: a URL final do anúncio geralmente não pode
   ser um link de afiliado puro. Precisa ser uma página com conteúdo real.
2. **Termos da Shopee**: o link de afiliado não deve ser promovido
   diretamente em anúncios pagos sem uma camada de conteúdo no meio.
3. **Medição confiável**: registrar o clique no servidor não depende de
   JavaScript no navegador nem é afetado por bloqueadores de anúncio.

## Próximos passos sugeridos

- Conteúdo próprio nas páginas de produto (prós/contras, comparação, foto
  própria). É o que sustenta SEO e Quality Score no Google Ads.
- `app/sitemap.ts` e `metadataBase` no layout raiz.
- Ligar o Google Ads Conversion Tracking na rota `/api/go`.
