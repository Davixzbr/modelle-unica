"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { useFavorites } from "@/hooks/useFavorites";
import ProductCard from "@/components/ProductCard";
import { EmptyState, ProductGridSkeleton } from "@/components/States";
import Icon from "@/components/Icon";
import { toast } from "@/components/Toast";
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

  function onRemove(id: string, name: string) {
    remove(id);
    toast(`${name} removida dos favoritos`, "warn");
  }

  if (!ready || products === null) {
    return <ProductGridSkeleton count={4} />;
  }

  if (!products.length) {
    return (
      <EmptyState
        title="Sua lista está vazia"
        hint="Toque no coração nas peças que você amou para salvá-las aqui — ficam guardadas neste dispositivo."
        action={
          <Link href="/catalogo" className="btn btn-solid">
            Explorar catálogo
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <p className="mb-6 text-[13px] text-ink-faint">
        {products.length} peça{products.length > 1 ? "s" : ""} salva
        {products.length > 1 ? "s" : ""} neste dispositivo
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="group relative">
            <ProductCard p={p} lowStock={lowStock} />
            <button
              onClick={() => onRemove(p.id, p.name)}
              className="absolute right-11 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-cream/90 text-ink-faint opacity-0 shadow-card transition-all duration-200 hover:text-wine group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Remover ${p.name} dos favoritos`}
              title="Remover dos favoritos"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
