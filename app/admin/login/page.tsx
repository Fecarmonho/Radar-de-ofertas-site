"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) throw new Error("Não foi possível criar a sessão.");

      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Email ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-ink/8 bg-white p-8 shadow-card"
      >
        <h1 className="font-display text-2xl font-bold text-ink">
          Painel <span className="text-fire">Radar de Ofertas</span>
        </h1>
        <p className="mt-1 text-sm text-ink/60">Entre com seu email e senha.</p>

        <label className="mt-6 block text-sm font-medium text-ink/80">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            autoComplete="email"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-ink/80">
          Senha
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            autoComplete="current-password"
          />
        </label>

        {error && <p className="mt-4 text-sm font-medium text-ember">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-fire mt-6 w-full rounded-full px-6 py-3 font-display font-bold text-white disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
