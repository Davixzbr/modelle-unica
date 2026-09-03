import type { Metadata } from "next";
import FavoritosClient from "./FavoritosClient";

export const metadata: Metadata = {
  title: "Meus favoritos",
  description: "As peças que você salvou na Modelle Única.",
};

export default function FavoritosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-caramel">Sua seleção</p>
      <h1 className="font-display mt-2 text-4xl text-ink">Favoritos</h1>
      <div className="mt-10">
        <FavoritosClient />
      </div>
    </div>
  );
}
