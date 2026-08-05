import { getSiteStatus } from "@/lib/site-status-db";
import SiteStatusForm from "@/components/admin/SiteStatusForm";

export const dynamic = "force-dynamic";

export default async function SitePage() {
  const status = await getSiteStatus();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Site</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink/55">
          Daqui você tira o site do ar e coloca de volta, sem precisar mexer na
          Vercel. O efeito é imediato e vale para todas as páginas. Este painel
          nunca sai do ar junto: você continua entrando e cadastrando produto
          normalmente.
        </p>
        {status.updatedAt && (
          <p className="mt-2 text-xs text-ink/40">
            Última mudança em {dataLegivel(status.updatedAt)}
            {status.updatedBy && ` por ${status.updatedBy}`}.
          </p>
        )}
      </div>

      <SiteStatusForm inicial={status} />
    </div>
  );
}

function dataLegivel(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
