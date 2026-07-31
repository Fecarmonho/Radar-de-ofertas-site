"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteSectionButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Remover a seção "${name}"? Os produtos dela não são apagados, só deixam de aparecer numa fileira separada.`
      )
    )
      return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/sections/${slug}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Não foi possível remover a seção.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="font-semibold text-ink/50 hover:text-ember disabled:opacity-50"
    >
      {deleting ? "Removendo..." : "Remover"}
    </button>
  );
}
