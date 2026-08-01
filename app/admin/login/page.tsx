"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function AdminLoginPage() {
  const router = useRouter();

  // null = ainda checando; true = já existe usuário (login normal);
  // false = ninguém cadastrado ainda (mostra tela de criar conta principal).
  const [hasAdmins, setHasAdmins] = useState<boolean | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/bootstrap")
      .then((r) => r.json())
      .then((data) => setHasAdmins(Boolean(data.hasAdmins)))
      .catch(() => setHasAdmins(true)); // se der erro, assume login normal
  }, []);

  async function loginWithFirebase() {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!response.ok) {
      // Senha certa, mas o servidor recusou a sessão (ex: conta existe no
      // Firebase e não está na lista de admins) — mostra o motivo real.
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? "Não foi possível criar a sessão.");
    }

    router.push("/admin");
    router.refresh();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithFirebase();
    } catch (err: any) {
      console.error(err);
      // Erros do Firebase Auth vêm com code "auth/..." — aí é credencial
      // errada mesmo. Qualquer outro erro traz a mensagem do servidor.
      const isCredentialError = typeof err?.code === "string" && err.code.startsWith("auth/");
      setError(
        isCredentialError || !(err instanceof Error)
          ? "Email ou senha incorretos."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleBootstrap(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não são iguais.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível criar a conta.");

      // Conta criada — já loga direto.
      await loginWithFirebase();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  if (hasAdmins === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <p className="text-sm text-ink/40">Carregando...</p>
      </main>
    );
  }

  const isBootstrap = !hasAdmins;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form
        onSubmit={isBootstrap ? handleBootstrap : handleLogin}
        className="w-full max-w-sm rounded-2xl border border-ink/8 bg-white p-8 shadow-card"
      >
        <h1 className="font-display text-2xl font-bold text-ink">
          Painel <span className="text-fire">Radar de Ofertas</span>
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          {isBootstrap
            ? "Primeiro acesso — crie a conta principal do painel."
            : "Entre com seu email e senha."}
        </p>

        {isBootstrap && (
          <label className="mt-6 block text-sm font-medium text-ink/80">
            Seu nome
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              autoComplete="name"
            />
          </label>
        )}

        <label className={`block text-sm font-medium text-ink/80 ${isBootstrap ? "mt-4" : "mt-6"}`}>
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
            autoComplete={isBootstrap ? "new-password" : "current-password"}
          />
        </label>

        {isBootstrap && (
          <label className="mt-4 block text-sm font-medium text-ink/80">
            Confirmar senha
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              autoComplete="new-password"
            />
          </label>
        )}

        {error && <p className="mt-4 text-sm font-medium text-ember">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-fire mt-6 w-full rounded-full px-6 py-3 font-display font-bold text-white disabled:opacity-60"
        >
          {loading ? "Aguarde..." : isBootstrap ? "Criar conta e entrar" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
