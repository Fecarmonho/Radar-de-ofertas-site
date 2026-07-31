"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Section } from "@/lib/affiliates";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function SectionForm({ initialSection }: { initialSection?: Section }) {
  const router = useRouter();
  const isEditing = Boolean(initialSection);

  const [name, setName] = useState(initialSection?.name ?? "");
  const [slug, setSlug] = useState(initialSection?.slug ?? "");
  const [slugEditedManually, setSlugEditedManually] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEditedManually) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !slug) {
      setError("Preencha o nome da seção.");
      return;
    }

    setSaving(true);
    try {
      const url = isEditing
        ? `/api/admin/sections/${initialSection!.slug}`
        : "/api/admin/sections";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing
        ? { slug, name, order: initialSection!.order }
        : { slug, name };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Não foi possível salvar a seção.");
      }

      router.push("/admin/secoes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg space-y-5 rounded-2xl border border-ink/8 bg-white p-6 shadow-card sm:p-8"
    >
      <div>
        <label className="block text-sm font-medium text-ink/80">
          Nome da seção
          <input
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="Ex: Fones de ouvido"
          />
        </label>
        <p className="mt-1 text-xs text-ink/40">
          É esse nome que vai aparecer como título da fileira de produtos na home.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink/80">
          Endereço (slug)
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlugEditedManually(true);
              setSlug(slugify(e.target.value));
            }}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
            placeholder="fones-de-ouvido"
          />
        </label>
      </div>

      {error && <p className="text-sm font-medium text-ember">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="btn-fire rounded-full px-6 py-3 font-display font-bold text-white disabled:opacity-60"
        >
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar seção"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/secoes")}
          className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink/70 hover:border-ink/30"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
