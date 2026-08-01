"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Avisa o servidor a cada página aberta, para alimentar o painel de
 * métricas em /admin/metricas. Independe do GA4 (que muita gente bloqueia)
 * e não guarda nada sobre a pessoa: só o endereço da página e de onde ela
 * veio, somados num contador por dia.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const ultimoEnviado = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || ultimoEnviado.current === pathname) return;
    ultimoEnviado.current = pathname;

    const params = new URLSearchParams(window.location.search);
    const campaign =
      params.get("utm_campaign") ?? params.get("utm_source") ?? params.get("src") ?? "";

    fetch("/api/track/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer: document.referrer, campaign }),
      keepalive: true,
    }).catch(() => {
      // Falhou? Paciência — medição não pode atrapalhar quem está no site.
    });
  }, [pathname]);

  return null;
}
