"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth).catch(() => {});
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:border-ember hover:text-ember"
    >
      Sair
    </button>
  );
}
