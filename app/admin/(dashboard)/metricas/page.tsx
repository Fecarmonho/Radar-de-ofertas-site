import { getRecentStats, totalsOf, rankOf } from "@/lib/stats-db";
import { getAllProducts } from "@/lib/products-db";
import DailyBarChart from "@/components/admin/DailyBarChart";

export const dynamic = "force-dynamic";

// Cores conferidas contra o fundo claro do painel (contraste e daltonismo).
const COR_VISITAS = "#1C7ED6";
const COR_CLIQUES = "#E8500F";

export default async function MetricasPage() {
  const [stats, products] = await Promise.all([getRecentStats(30), getAllProducts()]);

  const hoje = stats[stats.length - 1];
  const ultimos7 = stats.slice(-7);
  const total7 = totalsOf(ultimos7);
  const total30 = totalsOf(stats);
  const anteriores7 = totalsOf(stats.slice(-14, -7));

  const nomePorSlug = new Map(products.map((p) => [p.slug, p.title]));
  const produtos = rankOf(stats, "byProduct").slice(0, 8);
  const origens = rankOf(stats, "bySource").slice(0, 8);
  const paginas = rankOf(stats, "byPath").slice(0, 8);

  const semDados = total30.views === 0 && total30.clicks === 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Métricas</h1>
        <p className="mt-1 text-sm text-ink/50">
          Contagem própria, feita no seu servidor — não depende do Google
          Analytics e não é bloqueada por bloqueador de anúncio.
        </p>
      </div>

      {semDados && (
        <p className="mb-6 rounded-2xl border border-dashed border-ink/15 bg-white p-6 text-sm text-ink/60">
          Ainda não há movimento registrado. A contagem começa a partir do
          momento em que esta versão do site entra no ar — visitas antigas não
          aparecem aqui.
        </p>
      )}

      {/* ── Números do topo ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile titulo="Visitas hoje" valor={hoje?.views ?? 0} />
        <StatTile
          titulo="Visitas · 7 dias"
          valor={total7.views}
          variacao={variacao(total7.views, anteriores7.views)}
        />
        <StatTile
          titulo="Cliques · 7 dias"
          valor={total7.clicks}
          variacao={variacao(total7.clicks, anteriores7.clicks)}
          destaque
        />
        <StatTile
          titulo="Taxa de clique · 7 dias"
          valor={taxaDeClique(total7.clicks, total7.views)}
          legenda="cliques ÷ visitas"
        />
      </div>

      {/* ── Séries diárias ──────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Cartao titulo="Visitas por dia" subtitulo="últimos 30 dias">
          <DailyBarChart
            points={stats.map((d) => ({ date: d.date, value: d.views }))}
            color={COR_VISITAS}
            label="visitas"
          />
        </Cartao>
        <Cartao titulo="Cliques por dia" subtitulo="últimos 30 dias">
          <DailyBarChart
            points={stats.map((d) => ({ date: d.date, value: d.clicks }))}
            color={COR_CLIQUES}
            label="cliques"
          />
        </Cartao>
      </div>

      {/* ── Listas ──────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Cartao titulo="Produtos mais clicados" subtitulo="30 dias">
          <Lista
            itens={produtos.map((p) => ({
              nome: nomePorSlug.get(p.key) ?? p.key,
              total: p.total,
            }))}
            vazio="Nenhum clique ainda."
            cor={COR_CLIQUES}
          />
        </Cartao>

        <Cartao titulo="De onde vem o tráfego" subtitulo="30 dias">
          <Lista
            itens={origens.map((o) => ({ nome: rotuloOrigem(o.key), total: o.total }))}
            vazio="Sem dados de origem ainda."
            cor={COR_VISITAS}
          />
        </Cartao>

        <Cartao titulo="Páginas mais vistas" subtitulo="30 dias">
          <Lista
            itens={paginas.map((p) => ({
              nome: p.key === "/" ? "Home" : p.key,
              total: p.total,
            }))}
            vazio="Sem visitas registradas ainda."
            cor={COR_VISITAS}
          />
        </Cartao>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-ink/40">
        Visita é uma página aberta (robôs conhecidos são descartados). Clique é
        alguém saindo daqui para a Shopee pelo botão de oferta — é o número que
        vira comissão. A taxa de clique é o melhor termômetro de quando um
        produto ou um anúncio está funcionando.
      </p>
    </div>
  );
}

function StatTile({
  titulo,
  valor,
  legenda,
  variacao,
  destaque,
}: {
  titulo: string;
  valor: number | string;
  legenda?: string;
  variacao?: { texto: string; positiva: boolean } | null;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-card sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">
        {titulo}
      </p>
      <p
        className={`mt-1 font-display text-2xl font-extrabold sm:text-3xl ${
          destaque ? "text-signal" : "text-ink"
        }`}
      >
        {typeof valor === "number" ? valor.toLocaleString("pt-BR") : valor}
      </p>
      {variacao && (
        <p
          className={`mt-1 text-xs font-semibold ${
            variacao.positiva ? "text-emerald-600" : "text-ember"
          }`}
        >
          {variacao.texto} vs. 7 dias antes
        </p>
      )}
      {legenda && <p className="mt-1 text-xs text-ink/40">{legenda}</p>}
    </div>
  );
}

function Cartao({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-bold text-ink">{titulo}</h2>
        {subtitulo && <span className="text-xs text-ink/40">{subtitulo}</span>}
      </div>
      {children}
    </div>
  );
}

function Lista({
  itens,
  vazio,
  cor,
}: {
  itens: { nome: string; total: number }[];
  vazio: string;
  cor: string;
}) {
  if (itens.length === 0) {
    return <p className="text-sm text-ink/40">{vazio}</p>;
  }

  const maior = Math.max(...itens.map((i) => i.total));

  return (
    <ul className="flex flex-col gap-3">
      {itens.map((item) => (
        <li key={item.nome}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-ink/80" title={item.nome}>
              {item.nome}
            </span>
            <span className="shrink-0 text-sm font-bold text-ink">
              {item.total.toLocaleString("pt-BR")}
            </span>
          </div>
          {/* Barra de proporção: mesma leitura do gráfico, em miniatura. */}
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/5">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.total / maior) * 100}%`, backgroundColor: cor }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function taxaDeClique(clicks: number, views: number): string {
  if (views === 0) return "—";
  return `${((clicks / views) * 100).toFixed(1).replace(".", ",")}%`;
}

function variacao(atual: number, anterior: number) {
  if (anterior === 0) return atual > 0 ? { texto: "novo", positiva: true } : null;
  const pct = ((atual - anterior) / anterior) * 100;
  if (Math.abs(pct) < 1) return null;
  return {
    texto: `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`,
    positiva: pct > 0,
  };
}

function rotuloOrigem(key: string): string {
  if (key === "direto") return "Direto (digitou ou favoritos)";
  if (key === "interno") return "Navegação dentro do site";
  return key;
}
