"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export default function FavoritosClient() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mu_favorites");
      const list: string[] = raw ? JSON.parse(raw) : [];
      setIds(list);
      if (!list.length) {
        setProducts([]);
        return;
      }
      createClient()
        .from("products")
        .select("*, categories(name, slug), variant_stocks(total_stock)")
        .in("id", list)
        .then(({ data }) => setProducts((data as Product[]) || []));
    } catch {
      setProducts([]);
    }
  }, []);

  function removeFav(id: string) {
    const next = ids.filter((i) => i !== id);
    setIds(next);
    localStorage.setItem("mu_favorites", JSON.stringify(next));
    setProducts((prev) => prev?.filter((p) => p.id !== id) || null);
  }

  if (products === null) {
    return <p className="py-20 text-center text-ink-soft">Carregando favoritos…</p>;
  }

  if (!products.length) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl text-ink">Sua lista está vazia</p>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-soft">
          Toque no coração nas peças que você amou para salvá-las aqui.
        </p>
        <Link
          href="/catalogo"
          className="mt-8 inline-block rounded-full bg-ink px-10 py-3.5 text-[12px] font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-caramel"
        >
          Explorar catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
      {products.map((p) => (
        <div key={p.id} className="relative">
          <ProductCard p={p} />
          <button
            onClick={() => removeFav(p.id)}
            className="absolute right-2 top-2 z-10 rounded-full bg-cream/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink shadow-sm transition-colors hover:bg-caramel hover:text-white"
          >
            Remover
          </button>
        </div>
      ))}
    </div>
  );
}
