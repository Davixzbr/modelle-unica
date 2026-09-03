"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { brl } from "@/lib/format";
import { toast } from "@/components/Toast";
import { Spinner } from "@/components/States";
import type { Product } from "@/lib/types";

type Row = Product & { variant_stocks?: { total_stock: number }[] };

const STATUS_BADGE: Record<string, string> = { active: "green", draft: "amber", inactive: "gray" };
const STATUS_LABEL: Record<string, string> = { active: "Ativo", draft: "Rascunho", inactive: "Inativo" };

export default function ProductsClient({ initial, lowStock }: { initial: Row[]; lowStock: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [products, setProducts] = useState(initial);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState(params.get("status") || "");
  const [stockFilter, setStockFilter] = useState("");
  const [sort, setSort] = useState("ordem");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    let list = [...products];
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (stockFilter === "out") list = list.filter((p) => (p.variant_stocks?.[0]?.total_stock ?? 0) <= 0);
    if (stockFilter === "low")
      list = list.filter((p) => {
        const t = p.variant_stocks?.[0]?.total_stock ?? 0;
        return t > 0 && t <= lowStock;
      });
    if (q.trim()) {
      const n = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(n));
    }
    switch (sort) {
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
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
        list.sort((a, b) => a.sort_order - b.sort_order);
    }
    return list;
  }, [products, q, statusFilter, stockFilter, sort, lowStock]);

  async function setStatus(p: Row, status: Product["status"]) {
    setBusy(p.id);
    const { error } = await createClient().from("products").update({ status }).eq("id", p.id);
    setBusy(null);
    if (error) return toast("Erro ao atualizar status", "err");
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)));
    toast(status === "active" ? "Produto ativado" : "Produto pausado");
  }

  async function duplicate(p: Row) {
    setBusy(p.id);
    const supabase = createClient();
    try {
      const { data: copy, error } = await supabase
        .from("products")
        .insert({
          name: `${p.name} (cópia)`,
          slug: `${p.slug}-copia-${Date.now().toString(36)}`,
          description: p.description,
          short_description: p.short_description,
          fabric: p.fabric,
          size_chart: p.size_chart,
          category_id: p.category_id,
          collection_id: p.collection_id,
          price: p.price,
          promo_price: p.promo_price,
          main_image: p.main_image,
          images: p.images,
          sizes: p.sizes,
          colors: p.colors,
          tags: p.tags,
          featured: false,
          is_new: p.is_new,
          status: "draft",
          sort_order: p.sort_order + 1,
        })
        .select("id")
        .single();
      if (error) throw error;

      // Copia variantes
      const { data: vars } = await supabase
        .from("variants")
        .select("size, color, stock")
        .eq("product_id", p.id);
      if (vars?.length) {
        const { error: vErr } = await supabase
          .from("variants")
          .insert(vars.map((v) => ({ ...v, product_id: copy.id })));
        if (vErr) throw vErr;
      }

      toast("Produto duplicado como rascunho — abrindo para editar…");
      router.push(`/admin/produtos/${copy.id}`);
    } catch {
      toast("Erro ao duplicar produto", "err");
      setBusy(null);
    }
  }

  async function removeConfirmed() {
    if (!confirmDelete) return;
    const p = confirmDelete;
    setBusy(p.id);
    const { error } = await createClient().from("products").delete().eq("id", p.id);
    setBusy(null);
    setConfirmDelete(null);
    if (error) return toast("Erro ao excluir produto", "err");
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    toast(`"${p.name}" excluído`);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">Produtos</h1>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produto…"
            style={{ width: 200 }}
            aria-label="Buscar produto"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 140 }} aria-label="Filtrar por status">
            <option value="">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="draft">Rascunhos</option>
            <option value="inactive">Inativos</option>
          </select>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} style={{ width: 150 }} aria-label="Filtrar por estoque">
            <option value="">Todo o estoque</option>
            <option value="low">Estoque baixo</option>
            <option value="out">Esgotados</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 150 }} aria-label="Ordenar">
            <option value="ordem">Ordem manual</option>
            <option value="name">Nome A–Z</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
            <option value="views">Mais vistos</option>
          </select>
          <Link href="/admin/produtos/novo" className="a-btn">+ Novo</Link>
        </div>
      </div>

      <table className="a-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>Foto</th>
            <th>Produto</th>
            <th>Preço</th>
            <th>Estoque</th>
            <th>Status</th>
            <th style={{ width: 280 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => {
            const total = p.variant_stocks?.[0]?.total_stock ?? 0;
            return (
              <tr key={p.id}>
                <td>
                  <div className="relative h-12 w-10 overflow-hidden rounded bg-gray-100">
                    <Image src={p.main_image || p.images[0] || "/images/look-001.jpg"} alt="" fill sizes="40px" className="object-cover" />
                  </div>
                </td>
                <td>
                  <Link href={`/admin/produtos/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {p.sizes.join(", ")} · {p.colors.join(", ")}
                    {p.featured ? " · ★ destaque" : ""}
                  </p>
                </td>
                <td className="whitespace-nowrap">
                  {p.promo_price != null ? (
                    <>
                      <span className="font-medium">{brl(p.promo_price)}</span>{" "}
                      <span className="text-xs text-gray-400 line-through">{brl(p.price)}</span>
                    </>
                  ) : (
                    brl(p.price)
                  )}
                </td>
                <td>
                  <span className={`a-badge ${total <= 0 ? "red" : total <= lowStock ? "amber" : "gray"}`}>
                    {total <= 0 ? "Esgotado" : total <= lowStock ? `${total} un. (baixo)` : `${total} un.`}
                  </span>
                </td>
                <td>
                  <span className={`a-badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/produtos/${p.id}`} className="a-btn secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                      Editar
                    </Link>
                    <button onClick={() => duplicate(p)} disabled={busy === p.id} className="a-btn secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                      {busy === p.id ? <Spinner /> : "Duplicar"}
                    </button>
                    <Link href={`/produto/${p.slug}`} target="_blank" className="a-btn secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                      Ver
                    </Link>
                    {p.status === "active" ? (
                      <button onClick={() => setStatus(p, "inactive")} disabled={busy === p.id} className="a-btn secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                        Pausar
                      </button>
                    ) : (
                      <button onClick={() => setStatus(p, "active")} disabled={busy === p.id} className="a-btn secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                        Ativar
                      </button>
                    )}
                    <button onClick={() => setConfirmDelete(p)} disabled={busy === p.id} className="a-btn danger" style={{ padding: "6px 12px", fontSize: 12 }}>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!filtered.length && (
            <tr>
              <td colSpan={6} className="py-10 text-center text-gray-500">
                Nenhum produto encontrado com esses filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Confirmação de exclusão */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar exclusão"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir produto?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Você está excluindo <strong>{confirmDelete.name}</strong>. Esta ação não pode ser
              desfeita — prefere apenas <em>pausar</em> para tirá-lo da loja sem apagar?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="a-btn secondary">
                Cancelar
              </button>
              <button
                onClick={() => setStatus(confirmDelete, "inactive")}
                className="a-btn secondary"
              >
                Só pausar
              </button>
              <button onClick={removeConfirmed} disabled={busy === confirmDelete.id} className="a-btn danger">
                {busy === confirmDelete.id ? <Spinner /> : "Excluir mesmo assim"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
