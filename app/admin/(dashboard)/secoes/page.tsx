import Link from "next/link";
import { getAllSections } from "@/lib/sections-db";
import DeleteSectionButton from "@/components/admin/DeleteSectionButton";

export const dynamic = "force-dynamic";

export default async function AdminSectionsPage() {
  const sections = await getAllSections();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Seções</h1>
          <p className="mt-1 text-sm text-ink/50">
            Cada seção vira uma fileira separada de produtos na home.
          </p>
        </div>
        <Link
          href="/admin/secoes/nova"
          className="btn-fire rounded-full px-5 py-2.5 text-center text-sm font-bold text-white"
        >
          + Nova seção
        </Link>
      </div>

      {sections.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-ink/50">
          Nenhuma seção ainda. Crie uma, tipo "Fones de ouvido", e depois escolha
          ela ao cadastrar um produto.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {sections.map((section) => (
            <div
              key={section.slug}
              className="flex items-center justify-between rounded-2xl border border-ink/8 bg-white p-4 shadow-card sm:p-5"
            >
              <div>
                <p className="font-medium text-ink">{section.name}</p>
                <p className="text-xs text-ink/40">/{section.slug}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Link
                  href={`/admin/secoes/${section.slug}`}
                  className="font-semibold text-signal hover:underline"
                >
                  Editar
                </Link>
                <DeleteSectionButton slug={section.slug} name={section.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
