import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import "./globals.css";
import SWRegister from "@/components/SWRegister";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://modelleunica.com.br"),
  manifest: "/manifest.webmanifest",
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
    <html lang="pt-BR" className={`${outfit.variable} ${fraunces.variable}`}>
      <body>
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
