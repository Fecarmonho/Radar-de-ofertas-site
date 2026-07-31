import type { Metadata } from "next";
import "./globals.css";
import Analytics from "@/components/Analytics";

export const metadata: Metadata = {
  title: {
    default: "Radar de Ofertas — as melhores ofertas da Shopee",
    template: "%s | Radar de Ofertas",
  },
  description:
    "Rastreamos a Shopee para detectar as melhores ofertas. Comparações honestas, sem falsa promoção.",
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
