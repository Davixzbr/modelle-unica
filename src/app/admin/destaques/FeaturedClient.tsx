"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import Icon from "@/components/Icon";
import ToastHost from "@/components/Toast";
import { toast } from "@/components/Toast";
import type { Product } from "@/lib/types";

/**
 * Destaques da Home — uma linha por produto: Novidades (is_new), Destaque (featured) e ordem.
 * Salvamento em lote.
 */
export default function FeaturedClient({ initial }: { initial: Product[] }) {
  const [rows, setRows] = useState<Product[]>(initial);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? rows.filter((r) => r.name.toLowerCase().includes(t)) : rows;
  }, [rows, q]);

  const changedIds = useMemo(() => {
    const orig = new Map(initial.map((p) => [p.id, p]));
    return rows.filter((r) => {
      const o = orig.get(r.id);
      return (
        o &&
        (o.featured !== r.featured || o.is_new !== r.is_new || o.sort_order !== r.sort_order)
      );
    }).length;
  }, [rows, initial]);

  function patch(id: string, changes: Partial<Product>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  function move(r: Product, dir: -1 | 1) {
    patch(r.id, { sort_order: (r.sort_order || 0) + dir });
  }

  async function save() {
    setBusy(true);
    const supabase = createClient();
    const orig = new Map(initial.map((p) => [p.id, p]));
    const updates = rows
      .filter((r) => {
        const o = orig.get(r.id);
        return (
          o &&
          (o.featured !== r.featured || o.is_new !== r.is_new || o.sort_order !== r.sort_order)
        );
      })
      .map((r) => ({
        id: r.id,
        featured: r.featured,
        is_new: r.is_new,
        sort_order: r.sort_order || 0,
      }));

    let fails = 0;
    for (const u of updates) {
      const { error } = await supabase
        .from("products")
        .update({
          featured: u.featured,
          is_new: u.is_new,
          sort_order: u.sort_order,
        })
        .eq("id", u.id);
      if (error) fails++;
    }
    if (fails) toast(`Não foi possível salvar ${fails} produto(s).`, "error");
    else toast("Destaques salvos com sucesso.", "success");
    router.refresh();
    setBusy(false);
  }

  return (
    <>
      <ToastHost />
      <div className="a-pagehead">
        <div>
          <h1>Destaques da Home</h1>
          <p>Escolha o que aparece em “Novidades” e “Destaques” da vitrine.</p>
        </div>
        <button className="a-btn" onClick={save} disabled={busy || changedIds === 0}>
          {busy ? "Salvando…" : `Salvar (${changedIds})`}
        </button>
      </div>

      <div className="a-toolbar">
        <div className="search">
          <Icon name="search" size={15} />
          <input
            placeholder="Buscar produto…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar produto"
          />
        </div>
        <span className="text-[13px] text-[color:var(--a-muted)] ml-auto">
          {filtered.filter((r) => r.featured).length} em destaque ·{" "}
          {filtered.filter((r) => r.is_new).length} como novidade
        </span>
      </div>

      <div className="a-tablewrap">
        {filtered.length === 0 ? (
          <div className="a-empty">
            <div className="t">Nenhum produto encontrado</div>
          </div>
        ) : (
          <table className="a-table">
            <thead>
              <tr>
                <th className="w-14">Foto</th>
                <th>Produto</th>
                <th className="text-center">Novidade</th>
                <th className="text-center">Destaque</th>
                <th className="text-center">Ordem</th>
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
                      <div className="w-10 h-12 rounded-md bg-[color:var(--a-bg)]" />
                    )}
                  </td>
                  <td className="a-cellmain">
                    <Link href={`/admin/produtos/${r.id}`} className="hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={r.is_new}
                      onChange={(e) => patch(r.id, { is_new: e.target.checked })}
                      aria-label={`Novidade: ${r.name}`}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={r.featured}
                      onChange={(e) => patch(r.id, { featured: e.target.checked })}
                      aria-label={`Destaque: ${r.name}`}
                    />
                  </td>
                  <td className="text-center">
                    <span className="inline-flex items-center gap-1">
                      <button
                        className="a-iconbtn !w-7 !h-7"
                        onClick={() => move(r, -1)}
                        aria-label={`Subir ${r.name}`}
                      >
                        <Icon name="arrowUp" size={13} />
                      </button>
                      <span className="tabular-nums text-[13px] w-7">{r.sort_order || 0}</span>
                      <button
                        className="a-iconbtn !w-7 !h-7"
                        onClick={() => move(r, 1)}
                        aria-label={`Descer ${r.name}`}
                      >
                        <Icon name="arrowDown" size={13} />
                      </button>
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/produto/${r.slug}`}
                      target="_blank"
                      className="a-iconbtn"
                      title="Ver na loja"
                    >
                      <Icon name="external" size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
