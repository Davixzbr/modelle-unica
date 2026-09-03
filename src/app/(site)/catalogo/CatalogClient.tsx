"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { EmptyState } from "@/components/States";
import Icon from "@/components/Icon";
import { logEvent } from "@/lib/analytics";
import { brl } from "@/lib/format";
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

type Filters = {
  cat: string;
  col: string;
  size: string;
  color: string;
  maxPrice: number;
  inStock: boolean;
  tag: string;
};

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
  const params = useSearchParams();

  const [f, setF] = useState<Filters>({
    cat: params.get("cat") || "",
    col: params.get("colecao") || "",
    size: params.get("tam") || "",
    color: params.get("cor") || "",
    maxPrice: Number(params.get("max")) || 0,
    inStock: params.get("disp") === "1",
    tag: params.get("tag") || "",
  });
  const [sort, setSort] = useState(params.get("ord") || "recent");
  const [qInput, setQInput] = useState(params.get("q") || "");
  const [q, setQ] = useState(params.get("q") || "");
  const [visible, setVisible] = useState(12);
  const [drawer, setDrawer] = useState<"filters" | "sort" | null>(null);

  const patch = (p: Partial<Filters>) => {
    setF((prev) => ({ ...prev, ...p }));
    setVisible(12);
  };

  // Debounce da busca (300ms) + log
  useEffect(() => {
    const t = setTimeout(() => {
      if (qInput !== q) {
        setQ(qInput);
        setVisible(12);
        if (qInput.trim().length >= 3) logEvent("search", { term: qInput.trim() });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [qInput, q]);

  // Sincroniza com a URL (compartilhável)
  useEffect(() => {
    const sp = new URLSearchParams();
    if (f.cat) sp.set("cat", f.cat);
    if (f.tag) sp.set("tag", f.tag);
    if (f.size) sp.set("tam", f.size);
    if (f.color) sp.set("cor", f.color);
    if (f.col) sp.set("colecao", f.col);
    if (f.maxPrice) sp.set("max", String(f.maxPrice));
    if (f.inStock) sp.set("disp", "1");
    if (sort !== "recent") sp.set("ord", sort);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `/catalogo?${qs}` : "/catalogo");
  }, [f, sort, q]);

  // Trava scroll do body com drawer aberto
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const allSizes = useMemo(() => [...new Set(products.flatMap((p) => p.sizes))], [products]);
  const allColors = useMemo(
    () => [...new Set(products.flatMap((p) => p.colors))].sort(),
    [products]
  );
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
    if (f.cat) list = list.filter((p) => p.categories?.slug === f.cat);
    if (f.col) list = list.filter((p) => p.collections?.slug === f.col);
    if (f.tag) list = list.filter((p) => p.tags.includes(f.tag));
    if (f.size) list = list.filter((p) => p.sizes.includes(f.size));
    if (f.color) list = list.filter((p) => p.colors.includes(f.color));
    if (f.maxPrice > 0) list = list.filter((p) => (p.promo_price ?? p.price) <= f.maxPrice);
    if (f.inStock) list = list.filter((p) => p.total_stock > 0);
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
  }, [products, f, q, sort]);

  function resetFilters() {
    setF({ cat: "", col: "", size: "", color: "", maxPrice: 0, inStock: false, tag: "" });
    setQInput("");
    setQ("");
    setSort("recent");
    setVisible(12);
  }

  const hasActiveFilters = !!(
    f.cat ||
    f.tag ||
    f.size ||
    f.color ||
    f.col ||
    f.maxPrice ||
    f.inStock ||
    q
  );

  const activeCount =
    (f.cat ? 1 : 0) +
    (f.col ? 1 : 0) +
    (f.size ? 1 : 0) +
    (f.color ? 1 : 0) +
    (f.maxPrice ? 1 : 0) +
    (f.inStock ? 1 : 0) +
    (f.tag ? 1 : 0);

  const sortLabel = SORTS.find((s) => s.key === sort)?.label || "Ordenar";

  /* ── Conteúdo dos filtros (compartilhado entre desktop e drawer) ── */
  const FilterBody = (
    <div className="grid gap-6">
      <Group title="Categoria">
        <ChoiceRow
          options={categories.map((c) => ({ value: c.slug, label: c.name }))}
          value={f.cat}
          onChange={(v) => patch({ cat: v })}
          allLabel="Todas"
        />
      </Group>
      {collections.length > 0 && (
        <Group title="Coleção">
          <ChoiceRow
            options={collections.map((c) => ({ value: c.slug, label: c.name }))}
            value={f.col}
            onChange={(v) => patch({ col: v })}
            allLabel="Todas"
          />
        </Group>
      )}
      <Group title="Tamanho">
        <ChoiceRow
          options={allSizes.map((s) => ({ value: s, label: s }))}
          value={f.size}
          onChange={(v) => patch({ size: v })}
          allLabel="Todos"
        />
      </Group>
      <Group title="Cor">
        <ChoiceRow
          options={allColors.map((c) => ({ value: c, label: c }))}
          value={f.color}
          onChange={(v) => patch({ color: v })}
          allLabel="Todas"
        />
      </Group>
      <Group title="Preço">
        <div className="flex flex-wrap gap-2">
          <Chip on={f.maxPrice === 0} onClick={() => patch({ maxPrice: 0 })}>
            Qualquer
          </Chip>
          {priceOptions.map((v) => (
            <Chip key={v} on={f.maxPrice === v} onClick={() => patch({ maxPrice: v })}>
              Até {brl(v)}
            </Chip>
          ))}
        </div>
      </Group>
      <Group title="Coleção de tags">
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <Chip
              key={t}
              on={f.tag === t}
              onClick={() => patch({ tag: f.tag === t ? "" : t })}
              capitalize
            >
              {t === "promocao" ? "promoção" : t}
            </Chip>
          ))}
        </div>
      </Group>
      <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-ink">
        <input
          type="checkbox"
          checked={f.inStock}
          onChange={(e) => patch({ inStock: e.target.checked })}
          className="h-4 w-4 accent-[color:var(--color-gold)]"
        />
        Mostrar apenas peças disponíveis
      </label>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
      {/* Cabeçalho */}
      <div className="mb-10 text-center sm:mb-12">
        <p className="kicker">Vitrine</p>
        <h1 className="font-display mt-2 text-4xl text-ink sm:text-5xl">Catálogo</h1>
      </div>

      {/* Busca */}
      <div className="relative mx-auto mb-8 max-w-xl">
        <input
          type="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="Buscar por nome, cor, categoria…"
          className="w-full rounded-full border border-line bg-paper px-6 py-3.5 pr-12 text-sm outline-none transition-colors placeholder:text-ink-faint/60 focus:border-gold"
          aria-label="Buscar produtos"
        />
        {qInput && (
          <button
            onClick={() => {
              setQInput("");
              setQ("");
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink"
            aria-label="Limpar busca"
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>

      {/* Barra desktop: filtros inline resumidos + ordenar */}
      <div className="mb-4 hidden items-center justify-between gap-4 border-y border-line py-4 lg:flex">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px]">
          <InlineSelect
            label="Categoria"
            value={f.cat}
            onChange={(v) => patch({ cat: v })}
            options={categories.map((c) => ({ value: c.slug, label: c.name }))}
            allLabel="Todas"
          />
          <InlineSelect
            label="Tamanho"
            value={f.size}
            onChange={(v) => patch({ size: v })}
            options={allSizes.map((s) => ({ value: s, label: s }))}
            allLabel="Todos"
          />
          <InlineSelect
            label="Cor"
            value={f.color}
            onChange={(v) => patch({ color: v })}
            options={allColors.map((c) => ({ value: c, label: c }))}
            allLabel="Todas"
          />
          <InlineSelect
            label="Preço"
            value={f.maxPrice ? String(f.maxPrice) : ""}
            onChange={(v) => patch({ maxPrice: Number(v) || 0 })}
            options={priceOptions.map((v) => ({ value: String(v), label: `Até ${brl(v)}` }))}
            allLabel="Qualquer"
          />
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-gold-deep underline-offset-2 hover:underline"
            >
              <Icon name="x" size={13} /> Limpar filtros
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-ink-faint">{filtered.length} peça(s)</span>
          <InlineSelect
            label=""
            value={sort}
            onChange={(v) => setSort(v)}
            options={SORTS.map((s) => ({ value: s.key, label: s.label }))}
            allLabel=""
            bare
          />
        </div>
      </div>

      {/* Barra mobile: Filtros + Ordenar */}
      <div className="mb-6 flex items-center gap-3 lg:hidden">
        <button
          onClick={() => setDrawer("filters")}
          className={`btn btn-outline flex-1 !py-3 !text-[13px] ${activeCount ? "!border-ink" : ""}`}
          aria-haspopup="dialog"
        >
          <Icon name="filter" size={15} />
          Filtros{activeCount ? ` (${activeCount})` : ""}
        </button>
        <button
          onClick={() => setDrawer("sort")}
          className="btn btn-outline flex-1 !py-3 !text-[13px]"
          aria-haspopup="dialog"
        >
          {sortLabel}
          <Icon name="chevronDown" size={15} />
        </button>
      </div>
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <span className="text-xs text-ink-faint">{filtered.length} peça(s)</span>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 text-[13px] text-gold-deep"
          >
            <Icon name="x" size={13} /> Limpar tudo
          </button>
        )}
      </div>

      {/* Chips de filtros ativos (ambos) */}
      {hasActiveFilters && (
        <div className="mb-6 flex flex-wrap gap-2">
          {f.cat && <ActiveChip label={catName(f.cat)} onClear={() => patch({ cat: "" })} />}
          {f.col && <ActiveChip label={colName(f.col)} onClear={() => patch({ col: "" })} />}
          {f.size && <ActiveChip label={`Tam: ${f.size}`} onClear={() => patch({ size: "" })} />}
          {f.color && <ActiveChip label={f.color} onClear={() => patch({ color: "" })} />}
          {f.maxPrice > 0 && (
            <ActiveChip label={`Até ${brl(f.maxPrice)}`} onClear={() => patch({ maxPrice: 0 })} />
          )}
          {f.inStock && (
            <ActiveChip label="Disponíveis" onClear={() => patch({ inStock: false })} />
          )}
          {f.tag && (
            <ActiveChip
              label={f.tag === "promocao" ? "promoção" : f.tag}
              onClear={() => patch({ tag: "" })}
            />
          )}
          {q && <ActiveChip label={`"${q}"`} onClear={() => { setQInput(""); setQ(""); }} />}
        </div>
      )}

      {/* Resultado */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma peça encontrada"
          hint="Tente ajustar os filtros ou buscar por outro termo — talvez a peça que você procura ainda não tenha chegado."
          action={
            <button onClick={resetFilters} className="btn btn-solid">
              Limpar filtros
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {filtered.slice(0, visible).map((p) => (
              <ProductCard key={p.id} p={p} lowStock={lowStock} />
            ))}
          </div>
          {visible < filtered.length && (
            <div className="mt-16 text-center">
              <button onClick={() => setVisible((v) => v + 12)} className="btn btn-outline">
                Carregar mais ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      )}

      {/* Drawer filtros (mobile) */}
      {drawer === "filters" && (
        <BottomSheet title="Filtros" onClose={() => setDrawer(null)}>
          {FilterBody}
          <div className="sticky bottom-0 -mx-5 mt-8 flex gap-3 border-t border-line bg-paper px-5 py-4">
            <button onClick={resetFilters} className="btn btn-outline flex-1">
              Limpar
            </button>
            <button onClick={() => setDrawer(null)} className="btn btn-solid flex-1">
              Ver {filtered.length} peça(s)
            </button>
          </div>
        </BottomSheet>
      )}

      {/* Drawer ordenar (mobile) */}
      {drawer === "sort" && (
        <BottomSheet title="Ordenar por" onClose={() => setDrawer(null)}>
          <div className="grid gap-1">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setSort(s.key);
                  setDrawer(null);
                }}
                className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-[14.5px] transition-colors ${
                  sort === s.key
                    ? "bg-sand font-semibold text-ink"
                    : "text-ink-soft hover:bg-cream"
                }`}
              >
                {s.label}
                {sort === s.key && <Icon name="check" size={16} className="text-gold-deep" />}
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  );

  function catName(slug: string) {
    return categories.find((c) => c.slug === slug)?.name || slug;
  }
  function colName(slug: string) {
    return collections.find((c) => c.slug === slug)?.name || slug;
  }
}

/* ── Sub-componentes ── */

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
        {title}
      </p>
      {children}
    </div>
  );
}

function ChoiceRow({
  options,
  value,
  onChange,
  allLabel,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip on={value === ""} onClick={() => onChange("")}>
        {allLabel}
      </Chip>
      {options.map((o) => (
        <Chip key={o.value} on={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
  capitalize = false,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-4 py-2 text-[13px] transition-all duration-150 active:scale-95 ${
        on
          ? "border-ink bg-ink text-cream"
          : "border-line bg-paper text-ink-soft hover:border-gold hover:text-ink"
      } ${capitalize ? "capitalize" : ""}`}
    >
      {children}
    </button>
  );
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3.5 py-1.5 text-[12.5px] font-medium text-gold-deep">
      {label}
      <button onClick={onClear} aria-label={`Remover filtro ${label}`}>
        <Icon name="x" size={13} />
      </button>
    </span>
  );
}

function InlineSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  bare = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
  bare?: boolean;
}) {
  const current = value ? options.find((o) => o.value === value)?.label || allLabel : allLabel;
  return (
    <label className="inline-flex items-center gap-2 text-ink-faint">
      {label && <span className="text-xs uppercase tracking-wider">{label}</span>}
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`cursor-pointer appearance-none rounded-full border border-line bg-paper py-2 pl-4 pr-9 text-[13px] font-medium text-ink outline-none transition-colors hover:border-gold focus:border-gold ${
            bare && !value ? "!border-transparent !bg-transparent !px-2" : ""
          }`}
          aria-label={label || "Ordenar"}
        >
          {allLabel && <option value="">{allLabel}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">
          <Icon name="chevronDown" size={13} />
        </span>
      </span>
    </label>
  );
}

function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // ESC fecha o drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[86svh] overflow-y-auto rounded-t-2xl bg-cream px-5 pb-8 pt-4 shadow-float"
        style={{ animation: "sheetUp .28s cubic-bezier(.22,1,.36,1)" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-soft"
            aria-label="Fechar"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        {children}
        <style jsx>{`
          @keyframes sheetUp {
            from {
              transform: translateY(40px);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
