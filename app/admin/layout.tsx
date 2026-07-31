import type { Metadata } from "next";

// Aplica a TODAS as rotas dentro de /admin (login + dashboard),
// pedindo pros buscadores não indexarem nem seguirem links daqui.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
