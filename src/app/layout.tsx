import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://modelleunica.com.br"),
  title: {
    default: "Modelle Única — Moda fitness com curadoria autêntica",
    template: "%s · Modelle Única",
  },
  description:
    "Peças selecionadas uma a uma: moda fitness, lingerie e biquínis com caimento, qualidade e atitude. Compre pelo WhatsApp.",
  openGraph: {
    siteName: "Modelle Única",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Outfit:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
