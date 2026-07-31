"use client";

import Script from "next/script";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

/**
 * Carrega o GA4. Isso mede visitas de página (essencial pro Quality Score
 * do Google Ads e pra você saber se o tráfego pago realmente chega na
 * página). O clique de afiliado em si é medido no servidor, em
 * /api/go/[slug], que é mais confiável que medir só no cliente.
 */
export default function Analytics() {
  if (!GA4_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_ID}');
        `}
      </Script>
    </>
  );
}
