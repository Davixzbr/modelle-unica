"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { useFavorites } from "@/hooks/useFavorites";
import ProductCard from "@/components/ProductCard";
import { EmptyState, ProductGridSkeleton } from "@/components/States";
import type { Product } from "@/lib/types";

export default function FavoritosClient({ lowStock }: { lowStock: number }) {
  const { ids, remove, ready } = useFavorites();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!ids.length) {
      setProducts([]);
      return;
    }
    createClient()
      .rpc("products_with_stock", {
        p_order: "sort_order",
        p_asc: true,
        p_limit: 500,
        p_slug: null,
      })
      .then(({ data }) => {
        const all = (data as unknown as Product[]) || [];
        const map = new Map(all.map((p) => [p.id, p]));
        setProducts(ids.map((id) => map.get(id)).filter(Boolean) as Product[]);
      });
  }, [ids, ready]);

  if (!ready || products === null) {
    return <ProductGridSkeleton count={4} />;
  }

  if (!products.length) {
    return (
      <EmptyState
        title="Sua lista está vazia"
        hint="Toque no coração nas peças que você amou para salvá-las aqui — ficam guardadas neste dispositivo."
        action={
          <Link
            href="/catalogo"
            className="rounded-full bg-ink px-10 py-3.5 text-[12px] font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-caramel"
          >
            Explorar catálogo
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
      {products.map((p) => (
        <div key={p.id} className="relative">
          <ProductCard p={p} lowStock={lowStock} />
          <button
            onClick={() => remove(p.id)}
            className="absolute right-2 top-2 z-10 rounded-full bg-cream/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink shadow-sm transition-colors hover:bg-red-500 hover:text-white"
            aria-label={`Remover ${p.name} dos favoritos`}
          >
            Remover
          </button>
        </div>
      ))}
    </div>
  );
}
