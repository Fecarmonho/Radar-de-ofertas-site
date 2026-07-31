"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product, Section } from "@/lib/affiliates";

const CATEGORIES = ["eletronicos", "casa", "beleza", "moda", "outros"];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({
  initialProduct,
  sections,
}: {
  /** Se vier preenchido, o formulário funciona em modo edição. */
  initialProduct?: Product;
  /** Seções cadastradas no admin, pro seletor "Seção da home". */
  sections: Section[];
}) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);

  const [form, setForm] = useState<Product>(
    initialProduct ?? {
      slug: "",
      title: "",
      shortDescription: "",
      image: "/placeholder-produto.svg",
      price: "",
      category: CATEGORIES[0],
      network: "shopee",
      networkProductId: "",
      sectionSlug: sections[0]?.slug,
      brand: "",
      rating: undefined,
      reviewCount: undefined,
    }
  );
  const [slugEditedManually, setSlugEditedManually] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyTitle(value: string) {
    update("title", value);
    if (!slugEditedManually) {
      update("slug", slugify(value));
    }
  }

  function handleTitleChange(value: string) {
    applyTitle(value);
  }

  async function handleAutoFill() {
    if (!form.networkProductId) {
      setScrapeMessage("Cole o link da Shopee no campo acima primeiro.");
      return;
    }

    setScraping(true);
    setScrapeMessage(null);
    try {
      const response = await fetch("/api/admin/scrape-shopee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.networkProductId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setScrapeMessage(data.error ?? "Não consegui ler os dados desse link.");
        return;
      }

      if (data.title) applyTitle(data.title);
      if (data.image) update("image", data.image);
      if (data.description) update("shortDescription", data.description);
      if (data.price) update("price", data.price);

      const filled = [
        data.title && "nome",
        data.image && "foto",
        data.description && "descrição",
        data.price && "preço",
      ].filter(Boolean);

      setScrapeMessage(
        filled.length
          ? `Preenchi automaticamente: ${filled.join(", ")}. Confira e ajuste o que precisar.`
          : "Não consegui identificar os dados desse link. Preencha manualmente."
      );
    } catch {
      setScrapeMessage("Não consegui acessar esse link agora. Preencha manualmente.");
    } finally {
      setScraping(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.slug || !form.title || !form.price || !form.networkProductId) {
      setError("Preencha nome, endereço (slug), preço e link de afiliado.");
      return;
    }

    setSaving(true);
    try {
      const url = isEditing
        ? `/api/admin/products/${initialProduct!.slug}`
        : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Não foi possível salvar o produto.");
      }

      router.push("/admin");
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
      className="space-y-5 rounded-2xl border border-ink/8 bg-white p-6 shadow-card sm:p-8"
    >
      <div className="rounded-xl border border-fire/20 bg-fire/5 p-4">
        <label className="block text-sm font-medium text-ink/80">
          Link de afiliado da Shopee
          <input
            required
            value={form.networkProductId}
            onChange={(e) => update("networkProductId", e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
            placeholder="https://s.shopee.com.br/AbCd123"
          />
        </label>
        <p className="mt-1 text-xs text-ink/40">
          Gerado no painel affiliate.shopee.com.br → botão "Obter link".
        </p>
        <button
          type="button"
          onClick={handleAutoFill}
          disabled={scraping}
          className="mt-3 rounded-full border border-fire/40 bg-white px-4 py-2 text-sm font-bold text-fire transition-colors hover:bg-fire/10 disabled:opacity-60"
        >
          {scraping ? "Buscando dados..." : "✨ Preencher automaticamente"}
        </button>
        {scrapeMessage && (
          <p className="mt-2 text-xs font-medium text-ink/60">{scrapeMessage}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink/80">
          Nome do produto
          <input
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="Ex: Air Fryer 4 Litros"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink/80">
          Endereço da página (slug)
          <input
            required
            value={form.slug}
            onChange={(e) => {
              setSlugEditedManually(true);
              update("slug", slugify(e.target.value));
            }}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
            placeholder="air-fryer-4-litros"
          />
        </label>
        <p className="mt-1 text-xs text-ink/40">
          Preenche sozinho a partir do nome. Só letras minúsculas e traço.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink/80">
          Descrição curta
          <textarea
            required
            value={form.shortDescription}
            onChange={(e) => update("shortDescription", e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="Diga com suas palavras por que o produto vale a pena."
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink/80">
          Seção na home
          {sections.length === 0 ? (
            <p className="mt-1 rounded-lg border border-dashed border-ink/15 bg-paper px-3 py-2 text-xs text-ink/50">
              Nenhuma seção criada ainda.{" "}
              <Link href="/admin/secoes/nova" className="font-semibold text-signal">
                Crie uma seção
              </Link>{" "}
              (ex: "Fones de ouvido") pra organizar seus produtos em fileiras na home.
            </p>
          ) : (
            <select
              value={form.sectionSlug ?? ""}
              onChange={(e) => update("sectionSlug", e.target.value || undefined)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              <option value="">Sem seção</option>
              {sections.map((section) => (
                <option key={section.slug} value={section.slug}>
                  {section.name}
                </option>
              ))}
            </select>
          )}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink/80">
          Preço
          <input
            required
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="R$ 129,90"
          />
        </label>

        <label className="block text-sm font-medium text-ink/80">
          Categoria
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink/80">
          Foto do produto (URL)
          <input
            value={form.image}
            onChange={(e) => update("image", e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="/placeholder-produto.svg"
          />
        </label>
        {form.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.image}
            alt="Prévia da foto"
            className="mt-2 h-24 w-24 rounded-lg border border-ink/10 object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <label className="block text-sm font-medium text-ink/80">
          Marca
          <input
            value={form.brand ?? ""}
            onChange={(e) => update("brand", e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block text-sm font-medium text-ink/80">
          Nota (0 a 5)
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={form.rating ?? ""}
            onChange={(e) =>
              update("rating", e.target.value ? Number(e.target.value) : undefined)
            }
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block text-sm font-medium text-ink/80">
          Qtd. avaliações
          <input
            type="number"
            min={0}
            value={form.reviewCount ?? ""}
            onChange={(e) =>
              update("reviewCount", e.target.value ? Number(e.target.value) : undefined)
            }
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
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
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Adicionar produto"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink/70 hover:border-ink/30"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
