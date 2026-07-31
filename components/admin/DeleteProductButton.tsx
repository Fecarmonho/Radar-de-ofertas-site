"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProductButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remover "${title}"? Essa ação não pode ser desfeita.`)) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/products/${slug}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Não foi possível remover o produto.");
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
