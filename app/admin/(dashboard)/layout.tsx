import { redirect } from "next/navigation";
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="font-display text-lg font-bold text-ink">
              Painel <span className="text-fire">Radar de Ofertas</span>
            </p>
            <p className="text-xs text-ink/50">{session.email}</p>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
