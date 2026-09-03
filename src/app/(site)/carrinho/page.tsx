import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/site-config";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Carrinho",
  description:
    "Revise seu pedido da Modelle Única e finalize pelo WhatsApp — atendimento rápido e direto.",
  alternates: { canonical: "/carrinho" },
};

export default async function CarrinhoPage() {
  const site = await getSiteConfig();
  return (
    <CartClient siteName={site.name} whatsapp={site.whatsapp} />
  );
}
