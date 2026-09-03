"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import Icon from "@/components/Icon";
import ToastHost from "@/components/Toast";
import { toast } from "@/components/Toast";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import type { Product } from "@/lib/types";
import { brl } from "@/lib/format";

type Row = Product;

function ActionsMenu({
  row,
  onDone,
  onDuplicate,
}: {
  row: Row;
  onDone: () => void;
  onDuplicate: (row: Row) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function toggleActive() {
    const next = row.status === "active" ? "inactive" : "active";
    const supabase = createClient();
    const { error } = await supabase.from("products").update({ status: next }).eq("id", row.id);
    if (error) toast("Não foi possível atualizar o status.", "error");
    else toast(next === "active" ? "Produto ativado." : "Produto pausado.", "success");
    setOpen(false);
    onDone();
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="a-iconbtn"
        aria-label={`Ações para ${row.name}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="more" size={17} />
      </button>
      {open && (
        <div className="a-menu">
          <Link href={`/admin/produtos/${row.id}`}>
            <Icon name="edit" size={15} /> Editar
          </Link>
          <Link href={`/produto/${row.slug}`} target="_blank">
            <Icon name="eye" size={15} /> Visualizar
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              onDuplicate(row);
            }}
          >
            <Icon name="copy" size={15} /> Duplicar
          </button>
          <div className="sep" />
          <button onClick={toggleActive}>
            <Icon name={row.status === "active" ? "pause" : "play"} size={15} />
            {row.status === "active" ? "Pausar" : "Ativar"}
          </button>
          <button
            className="danger"
            onClick={() => {
              setOpen(false);
              onDoneDelete(row);
            }}
          >
            <Icon name="trash" size={15} /> Excluir
          </button>
        </div>
      )}
    </div>
  );

  function onDoneDelete(_row: Row) {
    // delegado via CustomEvent para o pai abrir o ConfirmDialog
    window.dispatchEvent(new CustomEvent("mu-delete-product", { detail: row }));
  }
}

export default function ProductsClient({
  initial,
  lowStock,
}: {
  initial: Row[];
  lowStock: number;
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: Event) => setToDelete((e as CustomEvent).detail as Row);
    window.addEventListener("mu-delete-product", handler);
    return () => window.removeEventListener("mu-delete-product", handler);
  }, []);

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.categories?.name).filter(Boolean))].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (term) {
        const hay = `${r.name} ${r.slug} ${r.categories?.name || ""} ${(r.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (status !== "all" && r.status !== status) return false;
      if (category !== "all" && r.categories?.name !== category) return false;
      const st = r.total_stock ?? 0;
      if (stockFilter === "out" && st !== 0) return false;
      if (stockFilter === "low" && !(st > 0 && st <= lowStock)) return false;
      if (onlyPromo && !r.promo_price) return false;
      if (onlyFeatured && !r.featured) return false;
      return true;
    });
  }, [rows, q, status, category, stockFilter, onlyPromo, onlyFeatured, lowStock]);

  const hasFilters =
    q || status !== "all" || category !== "all" || stockFilter !== "all" || onlyPromo || onlyFeatured;

  function stockBadge(r: Row) {
    const st = r.total_stock ?? 0;
    if (st === 0) return <span className="a-badge red">Esgotado</span>;
    if (st <= lowStock) return <span className="a-badge amber">{st} un.</span>;
    return <span className="a-badge gray">{st} un.</span>;
  }

  async function duplicate(row: Row) {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("duplicate_product", { p_id: row.id });
    if (error || !data) {
      // fallback: copia básica sem variantes
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = row;
      const copy = {
        ...rest,
        name: `${row.name} (cópia)`,
        slug: `${row.slug}-copia-${Date.now().toString(36).slice(-4)}`,
        status: "draft",
        views: 0,
        favorites_count: 0,
      };
      const { data: created, error: err2 } = await supabase
        .from("products")
        .insert(copy)
        .select("id")
        .single();
      if (err2 || !created) toast("Não foi possível duplicar o produto.", "error");
      else {
        toast("Produto duplicado (sem variantes) — ajuste o estoque.", "warn");
        router.refresh();
      }
    } else {
      toast("Produto duplicado com variantes.", "success");
      router.refresh();
    }
    setBusy(false);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", toDelete.id);
    if (error) toast("Não foi possível excluir o produto.", "error");
    else {
      toast("Produto excluído.", "success");
      setRows((rs) => rs.filter((r) => r.id !== toDelete.id));
      router.refresh();
    }
    setToDelete(null);
    setBusy(false);
  }

  const rowActions = (r: Row) => (
    <ActionsMenu row={r} onDone={() => router.refresh()} onDuplicate={duplicate} />
  );

  return (
    <>
      <ToastHost />

      <div className="a-toolbar">
        <div className="search">
          <Icon name="search" size={15} />
          <input
            placeholder="Buscar por nome, slug, categoria ou tag…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar produtos"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Pausados</option>
          <option value="draft">Rascunhos</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoria">
          <option value="all">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          aria-label="Estoque"
        >
          <option value="all">Todo o estoque</option>
          <option value="low">Estoque baixo</option>
          <option value="out">Esgotados</option>
        </select>
        <button className={`a-chip ${onlyPromo ? "on" : ""}`} onClick={() => setOnlyPromo((v) => !v)}>
          Em promoção
        </button>
        <button
          className={`a-chip ${onlyFeatured ? "on" : ""}`}
          onClick={() => setOnlyFeatured((v) => !v)}
        >
          Destaques
        </button>
        {hasFilters && (
          <button
            className="a-chip"
            onClick={() => {
              setQ("");
              setStatus("all");
              setCategory("all");
              setStockFilter("all");
              setOnlyPromo(false);
              setOnlyFeatured(false);
            }}
          >
            <Icon name="x" size={13} /> Limpar
          </button>
        )}
        <Link href="/admin/produtos/novo" className="a-btn sm ml-auto">
          <Icon name="plus" size={14} /> Novo produto
        </Link>
      </div>

      {/* Desktop: tabela */}
      <div className="a-tablewrap hidden md:block">
        {filtered.length === 0 ? (
          <div className="a-empty">
            <div className="ic">
              <Icon name="package" size={36} />
            </div>
            <div className="t">
              {hasFilters ? "Nenhum produto encontrado" : "Seu catálogo ainda está vazio"}
            </div>
            <p>
              {hasFilters
                ? "Tente ajustar a busca ou os filtros."
                : "Cadastre sua primeira peça para começar a vender."}
            </p>
            {hasFilters ? (
              <button
                className="a-btn secondary"
                onClick={() => {
                  setQ("");
                  setStatus("all");
                  setCategory("all");
                  setStockFilter("all");
                  setOnlyPromo(false);
                  setOnlyFeatured(false);
                }}
              >
                Limpar filtros
              </button>
            ) : (
              <Link href="/admin/produtos/novo" className="a-btn">
                <Icon name="plus" size={15} /> Adicionar primeiro produto
              </Link>
            )}
          </div>
        ) : (
          <table className="a-table">
            <thead>
              <tr>
                <th className="w-14">Foto</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Atualizado</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.main_image ? (
                      <div className="relative w-10 h-12 overflow-hidden rounded-md bg-[color:var(--a-bg)]">
                        <Image
                          src={r.main_image}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized={r.main_image?.startsWith("/")}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-12 rounded-md bg-[color:var(--a-bg)] flex items-center justify-center text-[color:var(--a-border)]">
                        <Icon name="image" size={16} />
                      </div>
                    )}
                  </td>
                  <td className="a-cellmain">
                    <Link href={`/admin/produtos/${r.id}`} className="hover:underline">
                      {r.name}
                    </Link>
                    {r.is_new && <span className="a-badge amber ml-2">NOVO</span>}
                  </td>
                  <td className="text-[color:var(--a-muted)]">{r.categories?.name || "—"}</td>
                  <td className="tabular-nums whitespace-nowrap">
                    {r.promo_price ? (
                      <>
                        <s className="text-[color:var(--a-muted)] mr-1.5">{brl(r.price)}</s>
                        <b>{brl(r.promo_price)}</b>
                      </>
                    ) : (
                      brl(r.price)
                    )}
                  </td>
                  <td>{stockBadge(r)}</td>
                  <td>
                    <span
                      className={`a-badge ${
                        r.status === "active" ? "green" : r.status === "draft" ? "amber" : "gray"
                      }`}
                    >
                      {r.status === "active" ? "Ativo" : r.status === "draft" ? "Rascunho" : "Pausado"}
                    </span>
                  </td>
                  <td className="text-[color:var(--a-muted)] text-xs whitespace-nowrap">
                    {r.updated_at ? new Date(r.updated_at).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td>{rowActions(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile: lista de cards */}
      <div className="a-rowlist md:hidden">
        {filtered.length === 0 && (
          <div className="a-card">
            <div className="a-empty">
              <div className="t">{hasFilters ? "Nada encontrado" : "Catálogo vazio"}</div>
              <p>{hasFilters ? "Ajuste a busca ou limpe os filtros." : "Cadastre a primeira peça."}</p>
              <Link href="/admin/produtos/novo" className="a-btn sm">
                <Icon name="plus" size={14} /> Novo produto
              </Link>
            </div>
          </div>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="a-row">
            {r.main_image ? (
              <div className="relative w-14 h-16 shrink-0 overflow-hidden rounded-lg bg-[color:var(--a-bg)]">
                <Image
                  src={r.main_image}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                  unoptimized={r.main_image?.startsWith("/")}
                />
              </div>
            ) : (
              <div className="w-14 h-16 shrink-0 rounded-lg bg-[color:var(--a-bg)] flex items-center justify-center text-[color:var(--a-border)]">
                <Icon name="image" size={18} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Link href={`/admin/produtos/${r.id}`} className="font-semibold text-[13.5px] truncate block">
                {r.name}
              </Link>
              <div className="text-xs text-[color:var(--a-muted)] mt-0.5">
                {r.categories?.name || "—"} ·{" "}
                {r.promo_price ? (
                  <>
                    <s>{brl(r.price)}</s> <b>{brl(r.promo_price)}</b>
                  </>
                ) : (
                  brl(r.price)
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {stockBadge(r)}
                <span
                  className={`a-badge ${
                    r.status === "active" ? "green" : r.status === "draft" ? "amber" : "gray"
                  }`}
                >
                  {r.status === "active" ? "Ativo" : r.status === "draft" ? "Rascunho" : "Pausado"}
                </span>
              </div>
            </div>
            {rowActions(r)}
          </div>
        ))}
      </div>

      {toDelete && (
        <ConfirmDialog
          title={`Excluir "${toDelete.name}"?`}
          message="Esta ação não pode ser desfeita. As variantes e o histórico do produto serão removidos."
          confirmLabel="Excluir mesmo assim"
          busy={busy}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
