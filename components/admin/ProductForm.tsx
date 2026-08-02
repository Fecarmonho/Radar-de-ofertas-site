"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product, Section, isPriceRange } from "@/lib/affiliates";
import { compressImageToBase64 } from "@/lib/image-compress";

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
      image: "",
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
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [avisoBusca, setAvisoBusca] = useState<string | null>(null);

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /**
   * Abre o link de afiliado no servidor e traz o que a Shopee publica na
   * página do produto: nome, foto, descrição, preço, nota e número de
   * avaliações. O que vier em branco continua sendo preenchido na mão.
   */
  async function buscarDadosDoLink() {
    const url = form.networkProductId.trim();
    if (!url) {
      setAvisoBusca("Cole o link de afiliado primeiro.");
      return;
    }

    setBuscando(true);
    setAvisoBusca(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/scrape-shopee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      // Um erro de infraestrutura (tempo esgotado, por exemplo) não volta
      // em JSON: nesse caso mostramos o código, que diz o que houve.
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        setAvisoBusca(
          data?.error ??
            `A busca falhou (código ${response.status}). Preencha os campos na mão.`
        );
        return;
      }

      const preenchidos: string[] = [];
      setForm((prev) => {
        const next = { ...prev };
        if (data.title) {
          next.title = data.title;
          if (!isEditing) next.slug = slugify(data.title);
          preenchidos.push("nome");
        }
        if (data.image) {
          next.image = data.image;
          preenchidos.push("foto");
        }
        if (data.description && !prev.shortDescription) {
          next.shortDescription = data.description;
          preenchidos.push("descrição");
        }
        if (data.price) {
          next.price = data.price;
          preenchidos.push("preço");
        }
        if (typeof data.rating === "number") {
          next.rating = data.rating;
          preenchidos.push("nota");
        }
        if (typeof data.reviewCount === "number") {
          next.reviewCount = data.reviewCount;
          preenchidos.push("avaliações");
        }
        return next;
      });

      // A Shopee nem sempre publica tudo — dizer o que faltou evita a
      // pessoa salvar achando que o preço veio junto.
      const faltaram: string[] = [];
      if (!data.price) faltaram.push("preço");
      if (typeof data.rating !== "number") faltaram.push("nota");

      setAvisoBusca(
        preenchidos.length > 0
          ? `Preenchi ${preenchidos.join(", ")}.` +
              (faltaram.length > 0
                ? ` A Shopee não publicou ${faltaram.join(" nem ")} nessa página — preencha à mão.`
                : " Confira e ajuste o que quiser.")
          : "O link abriu, mas não achei os dados. Preencha na mão."
      );
    } catch {
      setAvisoBusca("Não consegui acessar o link agora. Preencha na mão.");
    } finally {
      setBuscando(false);
    }
  }

  function handleTitleChange(value: string) {
    update("title", value);
    // O endereço da página (slug) é só o "endereço interno" da nossa
    // página de revisão do produto — quem leva o cliente até a Shopee é
    // sempre o link de afiliado. Por isso ele é gerado sozinho a partir
    // do nome, sem precisar de campo no formulário. Numa edição, o slug
    // já existente não muda (evita quebrar um link que já foi divulgado).
    if (!isEditing) {
      update("slug", slugify(value));
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Escolha um arquivo de imagem.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Essa foto é maior que 15MB, escolhe uma menor.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      // Comprime no navegador e guarda como base64 direto no produto —
      // sem precisar subir a foto pra nenhum serviço externo.
      const base64 = await compressImageToBase64(file);
      update("image", base64);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Falha ao processar a foto.");
    } finally {
      setUploading(false);
      e.target.value = ""; // permite escolher o mesmo arquivo de novo, se precisar
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title || !form.price || !form.networkProductId) {
      setError("Preencha nome, preço e link de afiliado.");
      return;
    }
    if (!form.image) {
      setError("Envie uma foto do produto.");
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
      <div>
        <label className="block text-sm font-medium text-ink/80">
          Link de afiliado da Shopee
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <input
              required
              value={form.networkProductId}
              onChange={(e) => update("networkProductId", e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
              placeholder="https://s.shopee.com.br/AbCd123"
            />
            <button
              type="button"
              onClick={buscarDadosDoLink}
              disabled={buscando || !form.networkProductId.trim()}
              className="whitespace-nowrap rounded-lg border border-signal/40 bg-signal/10 px-4 py-2 text-sm font-bold text-signal transition-colors hover:bg-signal/20 disabled:opacity-50"
            >
              {buscando ? "Buscando..." : "Buscar dados"}
            </button>
          </div>
        </label>
        <p className="mt-1 text-xs text-ink/40">
          Gerado no painel affiliate.shopee.com.br → botão "Obter link". É esse
          link que leva o cliente até a Shopee quando ele clica em "Ver oferta".
          Clique em "Buscar dados" para preencher nome, foto, descrição, preço e
          nota automaticamente.
        </p>
        {avisoBusca && (
          <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-xs font-medium text-ink/70">
            {avisoBusca}
          </p>
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
        <div>
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
          <label className="mt-2 flex items-start gap-2 text-xs text-ink/60">
            <input
              type="checkbox"
              checked={form.priceAutoUpdate !== false}
              onChange={(e) => update("priceAutoUpdate", e.target.checked)}
              disabled={isPriceRange(form.price)}
              className="mt-0.5"
            />
            <span>
              Conferir o preço na Shopee todo dia e atualizar sozinho.
              Desmarque se quiser deixar esse valor fixo.
            </span>
          </label>
          {isPriceRange(form.price) && (
            <p className="mt-1 rounded-lg bg-paper px-3 py-2 text-xs text-ink/60">
              Faixa de preço detectada — esse valor fica como você escreveu. A
              Shopee só publica o preço da variação mais barata, então a
              atualização automática não tem como remontar a faixa e por isso
              não encosta nela.
            </p>
          )}
          {form.priceUpdatedAt && (
            <p className="mt-1 text-xs text-ink/40">
              Última conferida:{" "}
              {new Date(form.priceUpdatedAt).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>

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
        <label className="block text-sm font-medium text-ink/80">Foto do produto</label>
        <div className="mt-1 flex items-center gap-4">
          {form.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.image}
              alt="Prévia da foto"
              className="h-20 w-20 rounded-lg border border-ink/10 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-ink/15 text-[10px] text-ink/30">
              Sem foto
            </div>
          )}

          <label className="cursor-pointer rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 hover:border-ink/30">
            {uploading ? "Processando..." : form.image ? "Trocar foto" : "Escolher foto"}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        <p className="mt-1 text-xs text-ink/40">
          Tira uma foto ou escolhe da galeria do celular, ou envia um arquivo do computador.
        </p>
        {uploadError && <p className="mt-1 text-xs font-medium text-ember">{uploadError}</p>}
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
          disabled={saving || uploading}
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
