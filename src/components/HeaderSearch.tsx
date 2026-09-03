"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";
import { brl } from "@/lib/format";
import { logEvent } from "@/lib/analytics";
import Icon from "@/components/Icon";
import type { Product } from "@/lib/types";

type Cat = { name: string; slug: string };
type Sug =
  | { kind: "produto"; label: string; href: string; price?: number; image?: string | null }
  | { kind: "categoria" | "colecao"; label: string; href: string };

/** Trecho casado em negrito. */
function Highlight({ text, needle }: { text: string; needle: string }) {
  const t = text.toLowerCase();
  const n = needle.toLowerCase();
  const idx = n ? t.indexOf(n) : -1;
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold text-ink">{text.slice(idx, idx + n.length)}</strong>
      {text.slice(idx + n.length)}
    </>
  );
}

/** Busca com autocomplete no header — sugere produtos, categorias e coleções. */
export default function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [flat, setFlat] = useState<Sug[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<{
    products: Product[];
    cats: Cat[];
    cols: Cat[];
  } | null>(null);
  const loggedRef = useRef<Set<string>>(new Set());

  const ensureData = useCallback(async () => {
    if (dataRef.current) return;
    setLoading(true);
    try {
      const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const [prodRes, catRes, colRes] = await Promise.all([
        supabase.rpc("products_with_stock", {
          p_order: "views",
          p_asc: false,
          p_limit: 500,
          p_slug: null,
        }),
        supabase.from("categories").select("name, slug").eq("active", true).order("sort_order"),
        supabase.from("collections").select("name, slug").eq("active", true).order("name"),
      ]);
      dataRef.current = {
        products: (prodRes.data as unknown as Product[]) || [],
        cats: (catRes.data as Cat[]) || [],
        cols: (colRes.data as Cat[]) || [],
      };
    } catch {
      dataRef.current = { products: [], cats: [], cols: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // ESC global fecha e devolve foco ao input
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Clique fora fecha
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Debounce 300ms: calcula sugestões + log de busca (≥3 chars, 1x por termo)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      const needle = q.trim().toLowerCase();
      await ensureData();
      const d = dataRef.current!;
      const out: Sug[] = [];
      if (needle.length >= 1) {
        for (const p of d.products) {
          const hay = `${p.name} ${p.colors.join(" ")} ${p.categories?.name || ""}`.toLowerCase();
          if (hay.includes(needle)) {
            out.push({
              kind: "produto",
              label: p.name,
              href: `/produto/${p.slug}`,
              price: p.promo_price ?? p.price,
              image: p.main_image || p.images[0] || null,
            });
            if (out.filter((s) => s.kind === "produto").length >= 6) break;
          }
        }
        for (const c of d.cats) {
          if (c.name.toLowerCase().includes(needle))
            out.push({ kind: "categoria", label: c.name, href: `/catalogo?cat=${c.slug}` });
        }
        for (const c of d.cols) {
          if (c.name.toLowerCase().includes(needle))
            out.push({ kind: "colecao", label: c.name, href: `/catalogo?colecao=${c.slug}` });
        }
      }
      setFlat(out);
      setActive(0);
      if (needle.length >= 3 && !loggedRef.current.has(needle)) {
        loggedRef.current.add(needle);
        logEvent("search", { term: needle });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, open, ensureData]);

  function go(s: Sug) {
    setOpen(false);
    setQ("");
    router.push(s.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[active]) go(flat[active]);
      else if (q.trim()) {
        setOpen(false);
        router.push(`/catalogo?q=${encodeURIComponent(q.trim())}`);
      }
    }
  }

  const needle = q.trim();

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 30);
        }}
        aria-label="Buscar no catálogo"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-sand"
      >
        <Icon name={open ? "x" : "search"} size={19} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,26rem)] overflow-hidden rounded-2xl border border-line bg-cream shadow-float"
          role="dialog"
          aria-label="Busca com sugestões"
        >
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <Icon name="search" size={16} className="text-ink-faint" />
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Buscar peças, categorias…"
              aria-label="Buscar produtos"
              role="combobox"
              aria-expanded={flat.length > 0}
              aria-controls="header-search-listbox"
              aria-activedescendant={flat[active] ? `hs-opt-${active}` : undefined}
              autoComplete="off"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint/60"
            />
          </div>

          <ul id="header-search-listbox" role="listbox" className="max-h-[60vh] overflow-y-auto py-2">
            {needle.length === 0 && (
              <li className="px-4 py-3 text-[13px] text-ink-faint">
                Digite para buscar peças, cores, categorias e coleções.
              </li>
            )}
            {needle.length > 0 && loading && flat.length === 0 && (
              <li className="px-4 py-3 text-[13px] text-ink-faint">Buscando…</li>
            )}
            {needle.length > 0 && !loading && flat.length === 0 && (
              <li className="px-4 py-4 text-[13px] text-ink-soft">
                Nada encontrado para “{needle}”.
                <button
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                    router.push("/catalogo");
                  }}
                  className="mt-2 block text-gold-deep underline underline-offset-2"
                >
                  Ver catálogo completo
                </button>
              </li>
            )}
            {flat.map((s, i) => (
              <li key={`${s.kind}-${s.href}-${i}`} role="option" id={`hs-opt-${i}`} aria-selected={i === active}>
                <button
                  onClick={() => go(s)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === active ? "bg-sand" : "bg-transparent"
                  }`}
                >
                  {s.kind === "produto" ? (
                    <>
                      <span className="relative h-14 w-11 flex-none overflow-hidden rounded-md bg-sand">
                        {s.image && (
                          <Image src={s.image} alt="" fill sizes="44px" className="object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-ink">
                          <Highlight text={s.label} needle={needle} />
                        </span>
                        {s.price != null && (
                          <span className="mt-0.5 block text-[12.5px] text-ink-soft">{brl(s.price)}</span>
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="text-[13.5px] text-ink-soft">
                      {s.kind === "categoria" ? "Categoria: " : "Coleção: "}
                      <Highlight text={s.label} needle={needle} />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
