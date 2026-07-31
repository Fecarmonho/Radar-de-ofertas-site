import { notFound } from "next/navigation";
import { getSectionBySlug } from "@/lib/sections-db";
import SectionForm from "@/components/admin/SectionForm";

export const dynamic = "force-dynamic";

export default async function EditSectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const section = await getSectionBySlug(params.slug);
  if (!section) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Editar seção</h1>
      <SectionForm initialSection={section} />
    </div>
  );
}
