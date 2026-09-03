"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import type { ShopEvent, Product } from "@/lib/types";

const PERIODS = [
  { key: 7, label: "7 dias" },
  { key: 30, label: "30 dias" },
  { key: 90, label: "90 dias" },
] as const;

const TYPE_LABEL: Record<string, string> = {
  view: "Visualizações",
  wa_click: "Cliques no WhatsApp",
  favorite: "Favoritos",
  share: "Compartilhamentos",
  search: "Buscas",
  filter: "Usos de filtro",
};

export default function AnalyticsClient({
  events,
  products,
}: {
  events: ShopEvent[];
  products: Pick<Product, "id" | "name" | "slug">[];
}) {
  const [days, setDays] = useState<number>(30);
  const nameOf = useMemo(() => {
    const m = new Map(products.map((p) => [p.id, p.name]));
    return (id: string | null) => (id ? m.get(id) || "—" : "—");
  }, [products]);

  const since = Date.now() - days * 864e5;
  const ev = useMemo(() => events.filter((e) => +new Date(e.created_at) >= since), [events, since]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of ev) c[e.type] = (c[e.type] || 0) + 1;
    return c;
  }, [ev]);

  const ranking = useMemo(() => {
    const m = new Map<string, { views: number; favs: number; wa: number }>();
    for (const e of ev) {
      if (!e.product_id) continue;
      const r = m.get(e.product_id) || { views: 0, favs: 0, wa: 0 };
      if (e.type === "view") r.views++;
      else if (e.type === "favorite") r.favs++;
      else if (e.type === "wa_click") r.wa++;
      m.set(e.product_id, r);
    }
    return [...m.entries()]
      .map(([id, r]) => ({ id, ...r, total: r.views + r.favs * 2 + r.wa * 4 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [ev]);

  const searches = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of ev) {
      if (e.type === "search" && e.term) {
        const t = e.term.toLowerCase().trim();
        if (t) m.set(t, (m.get(t) || 0) + 1);
      }
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [ev]);

  const maxTotal = Math.max(1, ...ranking.map((r) => r.total));

  return (
    <>
      <div className="a-pagehead">
        <div>
          <h1>Analytics</h1>
          <p>Comportamento dos visitantes — sem cookies, dados agregados.</p>
        </div>
        <div className="a-tabs !mb-0 !border-0">
          {PERIODS.map((p) => (
            <button key={p.key} className={days === p.key ? "on" : ""} onClick={() => setDays(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="a-stats mb-5">
        {["view", "favorite", "wa_click", "share"].map((t) => (
          <div className="a-stat" key={t}>
            <span className="ic">
              <Icon
                name={
                  t === "view" ? "eye" : t === "favorite" ? "heart" : t === "wa_click" ? "whatsapp" : "external"
                }
                size={18}
              />
            </span>
            <div className="num">{counts[t] || 0}</div>
            <div className="lbl">{TYPE_LABEL[t]} · {days}d</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="a-card">
          <div className="a-cardtitle">Ranking de interesse (top {ranking.length || 0})</div>
          {ranking.length === 0 ? (
            <p className="text-[13px] text-[color:var(--a-muted)] py-3">
              Sem dados neste período.
            </p>
          ) : (
            <div className="grid gap-3">
              {ranking.map((r) => (
                <div key={r.id}>
                  <div className="flex items-baseline justify-between text-[13px] mb-1">
                    <Link href={`/produto/${products.find((p) => p.id === r.id)?.slug || ""}`} target="_blank" className="font-medium hover:underline truncate">
                      {nameOf(r.id)}
                    </Link>
                    <span className="text-[color:var(--a-muted)] tabular-nums text-xs ml-2 flex-none">
                      {r.views} vistas · {r.favs} favs · {r.wa} wpp
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[color:var(--a-bg)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[color:var(--a-accent)]"
                      style={{ width: `${(r.total / maxTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="a-card">
          <div className="a-cardtitle">Buscas frequentes</div>
          {searches.length === 0 ? (
            <p className="text-[13px] text-[color:var(--a-muted)] py-3">
              Nenhuma busca registrada neste período.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {searches.map(([term, n]) => (
                <span key={term} className="a-chip on !cursor-default">
                  {term} <b className="font-semibold">×{n}</b>
                </span>
              ))}
            </div>
          )}
          <p className="a-helptext mt-4">
            Dica: termos buscados sem resultado indicam peças que a cliente queria e você não
            tinha — considere cadastrar.
          </p>
        </section>
      </div>
    </>
  );
}
