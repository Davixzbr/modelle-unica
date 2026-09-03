"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

type Cat = { id: string; name: string; slug: string };

const SORTS = [
  { key: "recent", label: "Mais recentes" },
  { key: "price_asc", label: "Menor preço" },
  { key: "price_desc", label: "Maior preço" },
  { key: "views", label: "Mais vendidos" },
] as const;

const TAGS = ["novo", "promocao", "exclusivo"];

export default function CatalogClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Cat[];
}) {
  const params = useSearchParams();
  const [cat, setCat] = useState(params.get("cat") || "");
  const [tag, setTag] = useState(params.get("tag") || "");
  const [size, setSize] = useState("");
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [sort, setSort] = useState<string>("recent");
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(12);

  useEffect(() => {
    setCat(params.get("cat") || "");
    setTag(params.get("tag") || "");
  }, [params]);

  const allSizes = useMemo(
    () => [...new Set(products.flatMap((p) => p.sizes))],
    [products]
  );
  const priceCeiling = useMemo(
    () => Math.ceil(Math.max(...products.map((p) => p.promo_price ?? p.price), 0) / 50) * 50,
    [products]
  );

  const filtered = useMemo(() => {
    let list = [...products];
    if (cat) list = list.filter((p) => p.categories?.slug === cat);
    if (tag) list = list.filter((p) => p.tags.includes(tag));
    if (size) list = list.filter((p) => p.sizes.includes(size));
    if (maxPrice > 0) list = list.filter((p) => (p.promo_price ?? p.price) <= maxPrice);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle) ||
          p.colors.some((c) => c.toLowerCase().includes(needle))
      );
    }
    switch (sort) {
      case "price_asc":
        list.sort((a, b) => (a.promo_price ?? a.price) - (b.promo_price ?? b.price));
        break;
      case "price_desc":
        list.sort((a, b) => (b.promo_price ?? b.price) - (a.promo_price ?? a.price));
        break;
      case "views":
        list.sort((a, b) => b.views - a.views);
        break;
      default:
        list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return list;
  }, [products, cat, tag, size, maxPrice, q, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.3em] text-caramel">Vitrine</p>
        <h1 className="font-display mt-2 text-4xl text-ink">Catálogo</h1>
      </div>

      {/* Busca */}
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nome, cor ou palavra-chave…"
        className="mb-6 w-full rounded-full border border-line bg-white px-6 py-3.5 text-sm outline-none transition-colors placeholder:text-ink-soft/50 focus:border-caramel"
      />

      {/* Filtros */}
      <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-line py-4 text-[13px]">
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-full border border-line bg-white px-4 py-2 outline-none focus:border-caramel"
          aria-label="Categoria"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="rounded-full border border-line bg-white px-4 py-2 outline-none focus:border-caramel"
          aria-label="Tamanho"
        >
          <option value="">Todos os tamanhos</option>
          {allSizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={maxPrice || ""}
          onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
          className="rounded-full border border-line bg-white px-4 py-2 outline-none focus:border-caramel"
          aria-label="Faixa de preço"
        >
          <option value="">Qualquer preço</option>
          <option value={Math.round(priceCeiling / 3)}>Até R$ {Math.round(priceCeiling / 3)}</option>
          <option value={Math.round((priceCeiling / 3) * 2)}>Até R$ {Math.round((priceCeiling / 3) * 2)}</option>
          <option value={priceCeiling}>Até R$ {priceCeiling}</option>
        </select>

        <div className="flex gap-2">
          {TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(tag === t ? "" : t)}
              className={`rounded-full px-4 py-2 capitalize transition-colors ${
                tag === t
                  ? "bg-ink text-cream"
                  : "border border-line bg-white text-ink-soft hover:border-caramel"
              }`}
            >
              {t === "promocao" ? "promoção" : t}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="ml-auto rounded-full border border-line bg-white px-4 py-2 outline-none focus:border-caramel"
          aria-label="Ordenar"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Resultado */}
      {filtered.length === 0 ? (
        <p className="py-20 text-center text-ink-soft">
          Nenhuma peça encontrada com esses filtros.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {filtered.slice(0, visible).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          {visible < filtered.length && (
            <div className="mt-14 text-center">
              <button
                onClick={() => setVisible((v) => v + 12)}
                className="rounded-full border border-ink px-10 py-3.5 text-[12px] font-semibold uppercase tracking-widest text-ink transition-all hover:bg-ink hover:text-cream"
              >
                Carregar mais ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
