import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-session";
import LogoutButton from "@/components/admin/LogoutButton";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validação de verdade da sessão acontece aqui, no servidor — o
  // middleware só faz uma checagem rápida de "existe cookie ou não".
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/8 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-lg font-bold text-ink">
                Painel <span className="text-fire">Radar de Ofertas</span>
              </p>
              <p className="text-xs text-ink/50">{session.email}</p>
            </div>
            <div className="sm:hidden">
              <LogoutButton />
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-4 sm:gap-6">
            {/* No celular os cinco links não cabem lado a lado: a faixa rola
                na horizontal. As margens negativas com padding fazem o
                primeiro e o último item respirarem em vez de colarem na
                borda da tela. A barra de rolagem fica escondida. */}
            <nav className="-mx-4 flex gap-5 overflow-x-auto px-4 text-sm font-semibold text-ink/60 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:overflow-x-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
              <Link href="/admin" className="shrink-0 transition-colors hover:text-ink">
                Produtos
              </Link>
              <Link href="/admin/metricas" className="shrink-0 transition-colors hover:text-ink">
                Métricas
              </Link>
              <Link href="/admin/secoes" className="shrink-0 transition-colors hover:text-ink">
                Seções
              </Link>
              <Link href="/admin/carrossel" className="shrink-0 transition-colors hover:text-ink">
                Carrossel
              </Link>
              <Link href="/admin/usuarios" className="shrink-0 transition-colors hover:text-ink">
                Usuários
              </Link>
            </nav>
            <div className="hidden sm:block">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
