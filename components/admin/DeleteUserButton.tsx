"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteUserButton({ uid, name }: { uid: string; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remover o acesso de "${name}"? Essa pessoa não vai mais conseguir logar.`))
      return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${uid}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Erro ao remover.");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Não foi possível remover o usuário.");
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
