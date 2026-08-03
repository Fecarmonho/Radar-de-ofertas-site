import type { Metadata } from "next";
import "./globals.css";
import Analytics from "@/components/Analytics";
import { SITE_URL } from "@/lib/site-url";

const DESCRICAO =
  "Rastreamos a Shopee para detectar as melhores ofertas. Comparações honestas, sem falsa promoção.";

export const metadata: Metadata = {
  // Sem metadataBase, qualquer imagem/URL relativa vira caminho para
  // localhost no build — e o preview do link não abre em lugar nenhum.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Radar de Ofertas — as melhores ofertas da Shopee",
    template: "%s | Radar de Ofertas",
  },
  description: DESCRICAO,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Radar de Ofertas",
    url: "/",
    title: "Radar de Ofertas — as melhores ofertas da Shopee",
    description: DESCRICAO,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Radar de Ofertas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Radar de Ofertas — as melhores ofertas da Shopee",
    description: DESCRICAO,
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-paper text-ink font-body antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
