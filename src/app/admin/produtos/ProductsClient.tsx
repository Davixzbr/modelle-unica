"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { brl } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductsClient({ initial }: { initial: Product[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [products, setProducts] = useState(initial);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState(params.get("status") || "");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...products];
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (q.trim()) {
      const n = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(n));
    }
    return list;
  }, [products, q, statusFilter]);

  async function setStatus(p: Product, status: Product["status"]) {
    setBusy(p.id);
    const { error } = await createClient().from("products").update({ status }).eq("id", p.id);
    setBusy(null);
    if (!error) {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)));
    }
  }

  async function duplicate(p: Product) {
    setBusy(p.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const copy = {
      name: `${p.name} (cópia)`,
      slug: `${p.slug}-copia-${Date.now().toString(36)}`,
      description: p.description,
      fabric: p.fabric,
      size_chart: p.size_chart,
      category_id: p.category_id,
      collection_id: p.collection_id,
      price: p.price,
      promo_price: p.promo_price,
      sizes: p.sizes,
      colors: p.colors,
      images: p.images,
      tags: p.tags,
      featured: false,
      status: "draft" as const,
      sort_order: p.sort_order + 1,
    };
    const { data, error } = await supabase.from("products").insert(copy).select("id").single();
    setBusy(null);
    if (!error && data) router.push(`/admin/produtos/${data.id}`);
  }

  async function remove(p: Product) {
    if (!confirm(`Excluir "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    setBusy(p.id);
    const { error } = await createClient().from("products").delete().eq("id", p.id);
    setBusy(null);
    if (!error) setProducts((prev) => prev.filter((x) => x.id !== p.id));
  }

  const STATUS_BADGE: Record<string, string> = {
    active: "green",
    draft: "amber",
    inactive: "gray",
  };
  const STATUS_LABEL: Record<string, string> = {
    active: "Ativo",
    draft: "Rascunho",
    inactive: "Inativo",
  };

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
            style={{ width: 220 }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 150 }}
          >
            <option value="">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="draft">Rascunhos</option>
            <option value="inactive">Inativos</option>
          </select>
          <Link href="/admin/produtos/novo" className="a-btn">
            + Novo
          </Link>
        </div>
      </div>

      <table className="a-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>Foto</th>
            <th>Produto</th>
            <th>Preço</th>
            <th>Status</th>
            <th style={{ width: 250 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="relative h-12 w-10 overflow-hidden rounded bg-gray-100">
                  <Image
                    src={p.images[0] || "/images/look-001.jpg"}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
              </td>
              <td>
                <Link href={`/admin/produtos/${p.id}`} className="font-medium hover:underline">
                  {p.name}
                </Link>
                <p className="text-xs text-gray-500">
                  {p.sizes.join(", ")} · {p.colors.join(", ")}
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
                <span className={`a-badge ${STATUS_BADGE[p.status]}`}>
                  {STATUS_LABEL[p.status]}
                </span>
              </td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/produtos/${p.id}`} className="a-btn secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                    Editar
                  </Link>
                  <button
                    onClick={() => duplicate(p)}
                    disabled={busy === p.id}
                    className="a-btn secondary"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    Duplicar
                  </button>
                  {p.status === "active" ? (
                    <button
                      onClick={() => setStatus(p, "inactive")}
                      disabled={busy === p.id}
                      className="a-btn secondary"
                      style={{ padding: "6px 12px", fontSize: 12 }}
                    >
                      Pausar
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(p, "active")}
                      disabled={busy === p.id}
                      className="a-btn secondary"
                      style={{ padding: "6px 12px", fontSize: 12 }}
                    >
                      Ativar
                    </button>
                  )}
                  <button
                    onClick={() => remove(p)}
                    disabled={busy === p.id}
                    className="a-btn danger"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!filtered.length && (
            <tr>
              <td colSpan={5} className="py-10 text-center text-gray-500">
                Nenhum produto encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
