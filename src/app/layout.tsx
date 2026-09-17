import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COONTROL RH - Gestão de Pessoas",
  description: "Sistema interno de Gestão de Pessoas da COONTROL",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#434342",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
