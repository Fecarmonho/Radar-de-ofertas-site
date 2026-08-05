import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageViewTracker from "@/components/PageViewTracker";
import SiteOffline from "@/components/SiteOffline";
import ConstructionBar from "@/components/ConstructionBar";
import { getSiteStatus } from "@/lib/site-status-db";

/**
 * Aqui é o único ponto por onde passa todo o site (home, produto, seção,
 * busca), por isso é aqui que o modo manutenção é aplicado. O /admin fica
 * de fora — é outro grupo de rotas — então dá para continuar cadastrando
 * produto com o site fora do ar.
 *
 * A leitura do estado acontece quando a página é gerada, não a cada
 * visita: as páginas do site são cacheadas por 60s. Para o botão do
 * painel fazer efeito na hora, /api/admin/site-status limpa esse cache.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = await getSiteStatus();

  // Sem PageViewTracker: visita a uma tela de manutenção não é visita ao
  // site, e contá-la só sujaria as métricas.
  if (status.state === "manutencao") {
    return <SiteOffline texto={status.textos.manutencao} />;
  }

  return (
    <>
      <PageViewTracker />
      {status.state === "construcao" && (
        <ConstructionBar texto={status.textos.construcao} />
      )}
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
