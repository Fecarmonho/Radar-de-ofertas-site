import Link from "next/link";
import { getAllAdmins } from "@/lib/admins-db";
import { getAdminSession } from "@/lib/admin-session";
import DeleteUserButton from "@/components/admin/DeleteUserButton";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [admins, session] = await Promise.all([getAllAdmins(), getAdminSession()]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Usuários</h1>
          <p className="mt-1 text-sm text-ink/50">
            Quem pode entrar no painel e mexer nos produtos.
          </p>
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="btn-fire rounded-full px-5 py-2.5 text-center text-sm font-bold text-white"
        >
          + Novo usuário
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {admins.map((admin) => (
          <div
            key={admin.uid}
            className="flex items-center justify-between rounded-2xl border border-ink/8 bg-white p-4 shadow-card sm:p-5"
          >
            <div>
              <p className="font-medium text-ink">
                {admin.name}
                {admin.uid === session?.uid && (
                  <span className="ml-2 rounded-full bg-fire/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-signal">
                    Você
                  </span>
                )}
              </p>
              <p className="text-xs text-ink/40">{admin.email}</p>
            </div>
            {admin.uid !== session?.uid && (
              <DeleteUserButton uid={admin.uid} name={admin.name} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
