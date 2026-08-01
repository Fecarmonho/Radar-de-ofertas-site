/**
 * Barras por dia (visitas ou cliques). Uma medida por gráfico, de
 * propósito: juntar visitas e cliques no mesmo desenho exigiria duas
 * escalas diferentes e faria a linha de baixo parecer irrelevante.
 *
 * É SVG puro, renderizado no servidor — sem biblioteca de gráfico e sem
 * JavaScript no navegador. O valor de cada dia aparece ao passar o mouse
 * (title nativo do SVG).
 */

export interface DailyPoint {
  date: string; // AAAA-MM-DD
  value: number;
}

const LARGURA_FATIA = 12;
const LARGURA_BARRA = 10;
const ALTURA_PLOT = 110;
const ALTURA_EIXO = 20;
/** Espaço reservado no topo para o número do dia de pico não sobrepor a barra. */
const FOLGA_TOPO = 14;
const RAIO = 4;

export default function DailyBarChart({
  points,
  color,
  label,
}: {
  points: DailyPoint[];
  /** Cor das barras (validada contra o fundo claro do painel) */
  color: string;
  /** Nome da medida, usado no texto que aparece ao passar o mouse */
  label: string;
}) {
  const largura = points.length * LARGURA_FATIA;
  const altura = ALTURA_PLOT + ALTURA_EIXO;
  const maximo = Math.max(1, ...points.map((p) => p.value));
  const indiceMaximo = points.findIndex((p) => p.value === maximo && p.value > 0);

  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      preserveAspectRatio="none"
      className="h-32 w-full"
      role="img"
      aria-label={`${label} por dia nos últimos ${points.length} dias`}
    >
      {/* linha de base discreta */}
      <line
        x1={0}
        y1={ALTURA_PLOT}
        x2={largura}
        y2={ALTURA_PLOT}
        stroke="#1B2430"
        strokeOpacity={0.12}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />

      {points.map((point, i) => {
        const x = i * LARGURA_FATIA + (LARGURA_FATIA - LARGURA_BARRA) / 2;
        // Dia com movimento nunca some: garante uma listra mínima visível.
        const h =
          point.value > 0
            ? Math.max(3, (point.value / maximo) * (ALTURA_PLOT - FOLGA_TOPO))
            : 0;
        const y = ALTURA_PLOT - h;

        return (
          <g key={point.date}>
            <title>{`${formatarDia(point.date)} · ${point.value} ${label}`}</title>
            {h > 0 ? (
              <path d={caminhoBarra(x, y, LARGURA_BARRA, h, RAIO)} fill={color} />
            ) : (
              // Dia sem movimento: um traço apagado, para não parecer buraco
              <rect x={x} y={ALTURA_PLOT - 2} width={LARGURA_BARRA} height={2} fill="#1B2430" fillOpacity={0.07} />
            )}
          </g>
        );
      })}

      {/* Rótulos: só o primeiro dia, o pico e o último — não todos. */}
      {points.length > 0 && (
        <>
          <text x={0} y={altura - 6} fontSize={9} fill="#1B2430" fillOpacity={0.45}>
            {formatarDia(points[0].date)}
          </text>
          <text
            x={largura}
            y={altura - 6}
            fontSize={9}
            textAnchor="end"
            fill="#1B2430"
            fillOpacity={0.45}
          >
            {formatarDia(points[points.length - 1].date)}
          </text>
          {indiceMaximo >= 0 && (
            <text
              x={indiceMaximo * LARGURA_FATIA + LARGURA_FATIA / 2}
              y={FOLGA_TOPO - 4}
              fontSize={9}
              fontWeight={700}
              textAnchor="middle"
              fill="#1B2430"
              fillOpacity={0.7}
            >
              {maximo}
            </text>
          )}
        </>
      )}
    </svg>
  );
}

/** Retângulo com o topo arredondado e a base encostada no eixo. */
function caminhoBarra(x: number, y: number, w: number, h: number, r: number): string {
  const raio = Math.min(r, w / 2, h);
  return [
    `M${x},${y + h}`,
    `L${x},${y + raio}`,
    `Q${x},${y} ${x + raio},${y}`,
    `L${x + w - raio},${y}`,
    `Q${x + w},${y} ${x + w},${y + raio}`,
    `L${x + w},${y + h}`,
    "Z",
  ].join(" ");
}

function formatarDia(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}
