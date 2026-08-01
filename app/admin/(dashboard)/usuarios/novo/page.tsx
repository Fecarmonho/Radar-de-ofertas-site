"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Erro ao criar usuário.");

      router.push("/admin/usuarios");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar usuário.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Novo usuário</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-lg space-y-5 rounded-2xl border border-ink/8 bg-white p-6 shadow-card sm:p-8"
      >
        <label className="block text-sm font-medium text-ink/80">
          Nome
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>

        <label className="block text-sm font-medium text-ink/80">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>

        <label className="block text-sm font-medium text-ink/80">
          Senha provisória
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-xs font-normal text-ink/40">Pelo menos 6 caracteres.</p>
        </label>

        {error && <p className="text-sm font-medium text-ember">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-fire rounded-full px-6 py-3 font-display font-bold text-white disabled:opacity-60"
          >
            {saving ? "Criando..." : "Criar usuário"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/usuarios")}
            className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink/70 hover:border-ink/30"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
