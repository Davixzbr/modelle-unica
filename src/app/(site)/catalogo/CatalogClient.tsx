"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { EmptyState } from "@/components/States";
import { logEvent } from "@/lib/analytics";
import type { Product } from "@/lib/types";

type Cat = { id: string; name: string; slug: string };
type Col = { id: string; name: string; slug: string };

const SORTS = [
  { key: "recent", label: "Mais recentes" },
  { key: "price_asc", label: "Menor preço" },
  { key: "price_desc", label: "Maior preço" },
  { key: "views", label: "Mais vistos" },
] as const;

const TAGS = ["novo", "promocao", "exclusivo"];

export default function CatalogClient({
  products,
  categories,
  collections,
  lowStock,
}: {
  products: Product[];
  categories: Cat[];
  collections: Col[];
  lowStock: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [cat, setCat] = useState(params.get("cat") || "");
  const [tag, setTag] = useState(params.get("tag") || "");
  const [size, setSize] = useState(params.get("tam") || "");
  const [color, setColor] = useState(params.get("cor") || "");
  const [col, setCol] = useState(params.get("colecao") || "");
  const [maxPrice, setMaxPrice] = useState(Number(params.get("max")) || 0);
  const [inStock, setInStock] = useState(params.get("disp") === "1");
  const [sort, setSort] = useState(params.get("ord") || "recent");
  const [qInput, setQInput] = useState(params.get("q") || "");
  const [q, setQ] = useState(params.get("q") || "");
  const [visible, setVisible] = useState(12);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Debounce da busca (300ms) + log
  useEffect(() => {
    const t = setTimeout(() => {
      if (qInput !== q) {
        setQ(qInput);
        setVisible(12);
        if (qInput.trim().length >= 3) {
          logEvent("search", { term: qInput.trim() });
        }
      }
    }, 300);
    return () => clearTimeout(t);
  }, [qInput, q]);

  // Sincroniza filtros com a URL (compartilhável)
  useEffect(() => {
    const sp = new URLSearchParams();
    if (cat) sp.set("cat", cat);
    if (tag) sp.set("tag", tag);
    if (size) sp.set("tam", size);
    if (color) sp.set("cor", color);
    if (col) sp.set("colecao", col);
    if (maxPrice) sp.set("max", String(maxPrice));
    if (inStock) sp.set("disp", "1");
    if (sort !== "recent") sp.set("ord", sort);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `/catalogo?${qs}` : "/catalogo");
  }, [cat, tag, size, color, col, maxPrice, inStock, sort, q]);

  const allSizes = useMemo(() => [...new Set(products.flatMap((p) => p.sizes))], [products]);
  const allColors = useMemo(() => [...new Set(products.flatMap((p) => p.colors))].sort(), [products]);
  const priceCeiling = useMemo(
    () => Math.ceil(Math.max(...products.map((p) => p.promo_price ?? p.price), 0) / 50) * 50,
    [products]
  );

  const priceOptions = useMemo(() => {
    const opts = new Set<number>();
    for (let step = Math.round(priceCeiling / 3 / 25) * 25; step < priceCeiling; step += 50) {
      opts.add(step);
    }
    opts.add(priceCeiling);
    return [...opts].sort((a, b) => a - b);
  }, [priceCeiling]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (cat) list = list.filter((p) => p.categories?.slug === cat);
    if (col) list = list.filter((p) => p.collections?.slug === col);
    if (tag) list = list.filter((p) => p.tags.includes(tag));
    if (size) list = list.filter((p) => p.sizes.includes(size));
    if (color) list = list.filter((p) => p.colors.includes(color));
    if (maxPrice > 0) list = list.filter((p) => (p.promo_price ?? p.price) <= maxPrice);
    if (inStock) list = list.filter((p) => (p.total_stock) > 0);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.short_description.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle) ||
          p.colors.some((c) => c.toLowerCase().includes(needle)) ||
          (p.categories?.name || "").toLowerCase().includes(needle) ||
          (p.collections?.name || "").toLowerCase().includes(needle)
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
  }, [products, cat, col, tag, size, color, maxPrice, inStock, q, sort]);

  function resetFilters() {
    setCat(""); setTag(""); setSize(""); setColor(""); setCol("");
    setMaxPrice(0); setInStock(false); setSort("recent"); setQInput(""); setQ("");
    setVisible(12);
  }

  const hasActiveFilters = !!(cat || tag || size || color || col || maxPrice || inStock || q);

  const filterControls = (
    <>
      <select value={cat} onChange={(e) => { setCat(e.target.value); setVisible(12); }} aria-label="Categoria">
        <option value="">Todas as categorias</option>
        {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
      </select>

      <select value={col} onChange={(e) => { setCol(e.target.value); setVisible(12); }} aria-label="Coleção">
        <option value="">Todas as coleções</option>
        {collections.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
      </select>

      <select value={size} onChange={(e) => { setSize(e.target.value); setVisible(12); }} aria-label="Tamanho">
        <option value="">Todos os tamanhos</option>
        {allSizes.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <select value={color} onChange={(e) => { setColor(e.target.value); setVisible(12); }} aria-label="Cor">
        <option value="">Todas as cores</option>
        {allColors.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <select value={maxPrice || ""} onChange={(e) => { setMaxPrice(Number(e.target.value) || 0); setVisible(12); }} aria-label="Faixa de preço">
        <option value="">Qualquer preço</option>
        {priceOptions.map((v) => (
          <option key={v} value={v}>Até R$ {v}</option>
        ))}
      </select>

      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-soft">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => { setInStock(e.target.checked); setVisible(12); }}
          className="h-4 w-4"
        />
        Só disponíveis
      </label>

      <div className="flex gap-2">
        {TAGS.map((t) => (
          <button
            key={t}
            onClick={() => { setTag(tag === t ? "" : t); setVisible(12); }}
            aria-pressed={tag === t}
            className={`rounded-full px-4 py-2 capitalize transition-colors ${
              tag === t ? "bg-ink text-cream" : "border border-line bg-white text-ink-soft hover:border-caramel"
            }`}
          >
            {t === "promocao" ? "promoção" : t}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-caramel">Vitrine</p>
          <h1 className="font-display mt-2 text-4xl text-ink">Catálogo</h1>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-full border border-line bg-white px-4 py-2.5 text-[13px] outline-none focus:border-caramel"
          aria-label="Ordenar"
        >
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {/* Busca com limpar */}
      <div className="relative mb-5">
        <input
          type="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="Buscar por nome, cor, categoria…"
          className="w-full rounded-full border border-line bg-white px-6 py-3.5 pr-12 text-sm outline-none transition-colors placeholder:text-ink-soft/50 focus:border-caramel"
          aria-label="Buscar produtos"
        />
        {qInput && (
          <button
            onClick={() => { setQInput(""); setQ(""); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
            aria-label="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Botão filtros (mobile) */}
      <div className="mb-4 flex items-center gap-3 lg:hidden">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
          className="rounded-full border border-line bg-white px-5 py-2.5 text-[13px] text-ink"
        >
          {filtersOpen ? "Ocultar filtros ▲" : "Filtros ▼"}
        </button>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="text-[13px] text-caramel underline-offset-2 hover:underline">
            Limpar tudo
          </button>
        )}
        <span className="ml-auto text-xs text-ink-soft">{filtered.length} peça(s)</span>
      </div>

      {/* Filtros desktop */}
      <div className="mb-10 hidden flex-wrap items-center gap-x-5 gap-y-4 border-y border-line py-4 text-[13px] lg:flex">
        {filterControls}
        {hasActiveFilters && (
          <button onClick={resetFilters} className="text-[13px] text-caramel underline-offset-2 hover:underline">
            Limpar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-ink-soft">{filtered.length} peça(s)</span>
      </div>

      {/* Filtros mobile (colapsáveis) */}
      {filtersOpen && (
        <div className="mb-8 flex flex-col gap-4 border-y border-line py-4 text-[13px] lg:hidden">
          {filterControls}
        </div>
      )}

      {/* Resultado */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma peça encontrada"
          hint="Tente ajustar os filtros ou buscar por outro termo."
          action={
            <button
              onClick={resetFilters}
              className="rounded-full border border-ink px-8 py-3 text-[12px] font-semibold uppercase tracking-widest text-ink transition-all hover:bg-ink hover:text-cream"
            >
              Limpar filtros
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
            {filtered.slice(0, visible).map((p) => (
              <ProductCard key={p.id} p={p} lowStock={lowStock} />
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
