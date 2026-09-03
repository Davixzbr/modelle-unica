"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import AdminCharts, { type Stats30d } from "@/components/admin/AdminCharts";
import type { Product } from "@/lib/types";
import type { ZeroVariant } from "./page";

type EvRow = { type: string; product_id: string | null; created_at: string };

const PERIODS = [
  { key: 1, label: "Hoje" },
  { key: 7, label: "7 dias" },
  { key: 30, label: "30 dias" },
] as const;

export default function DashboardClient({
  products,
  events,
  lowStock,
  zeroVariants = [],
  stats = [],
}: {
  products: Product[];
  events: EvRow[];
  lowStock: number;
  zeroVariants?: ZeroVariant[];
  stats?: Stats30d[];
}) {
  const [days, setDays] = useState<number>(7);

  const active = products.filter((p) => p.status === "active");
  const lowList = active.filter(
    (p) => (p.total_stock ?? 0) > 0 && (p.total_stock ?? 0) <= lowStock
  );
  const outList = active.filter((p) => (p.total_stock ?? 0) === 0);
  const noImage = products.filter((p) => !p.main_image && !(p.images || []).length);
  const noPrice = products.filter((p) => p.price == null);

  const since = useMemo(() => Date.now() - days * 864e5, [days]);
  const ev = useMemo(() => events.filter((e) => +new Date(e.created_at) >= since), [events, since]);

  const waClicks = ev.filter((e) => e.type === "wa_click").length;
  const views = ev.filter((e) => e.type === "view").length;

  const perProduct = useMemo(() => {
    const map = new Map<string, { views: number; favs: number; wa: number }>();
    for (const e of ev) {
      if (!e.product_id) continue;
      const rec = map.get(e.product_id) || { views: 0, favs: 0, wa: 0 };
      if (e.type === "view") rec.views++;
      if (e.type === "favorite") rec.favs++;
      if (e.type === "wa_click") rec.wa++;
      map.set(e.product_id, rec);
    }
    const score = (r: { views: number; favs: number; wa: number }) => r.views + r.favs * 3 + r.wa * 5;
    return [...map.entries()]
      .map(([id, r]) => ({ id, ...r, score: score(r) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [ev]);

  const nameOf = (id: string) => products.find((p) => p.id === id)?.name || "—";

  const alerts = [
    ...outList.map((p) => ({
      level: "danger" as const,
      icon: "alert",
      text: (
        <>
          <b>{p.name}</b> está esgotado.
        </>
      ),
      action: { href: `/admin/produtos/${p.id}`, label: "Repor estoque" },
    })),
    ...lowList.map((p) => ({
      level: "warn" as const,
      icon: "alert",
      text: (
        <>
          <b>{p.name}</b> com apenas {p.total_stock} peça(s).
        </>
      ),
      action: { href: `/admin/produtos/${p.id}`, label: "Repor" },
    })),
    ...noImage.map((p) => ({
      level: "warn" as const,
      icon: "image",
      text: (
        <>
          <b>{p.name}</b> está sem foto.
        </>
      ),
      action: { href: `/admin/produtos/${p.id}`, label: "Adicionar" },
    })),
    ...noPrice.map((p) => ({
      level: "warn" as const,
      icon: "alert",
      text: (
        <>
          <b>{p.name}</b> está sem preço definido.
        </>
      ),
      action: { href: `/admin/produtos/${p.id}`, label: "Definir" },
    })),
  ].slice(0, 6);

  return (
    <div className="grid gap-5">
      {/* Período */}
      <div className="flex items-center gap-2">
        <div className="a-tabs !mb-0 !border-0">
          {PERIODS.map((p) => (
            <button key={p.key} className={days === p.key ? "on" : ""} onClick={() => setDays(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas */}
      <div className="a-stats">
        <div className="a-stat">
          <span className="ic">
            <Icon name="package" size={18} />
          </span>
          <div className="num">{active.length}</div>
          <div className="lbl">Produtos ativos</div>
        </div>
        <div className="a-stat">
          <span className="ic">
            <Icon name="alert" size={18} />
          </span>
          <div className="num">{lowList.length}</div>
          <div className="lbl">Estoque baixo</div>
        </div>
        <div className="a-stat">
          <span className="ic">
            <Icon name="x" size={18} />
          </span>
          <div className="num">{outList.length}</div>
          <div className="lbl">Esgotados</div>
        </div>
        <div className="a-stat">
          <span className="ic">
            <Icon name="whatsapp" size={18} />
          </span>
          <div className="num">{waClicks}</div>
          <div className="lbl">Cliques no WhatsApp · {days}d</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Gráficos 30d (SVG puro) */}
        <section className="a-card lg:col-span-2">
          <div className="a-cardtitle">
            Últimos 30 dias
            <span className="hint">comparativo vs. 30d anteriores</span>
          </div>
          <AdminCharts stats={stats} />
        </section>

        {/* Estoque baixo com drill-down de variantes */}
        <section className="a-card">
          <div className="a-cardtitle">
            Estoque baixo
            <span className="hint">{lowList.length + outList.length} produto(s)</span>
          </div>
          {lowList.length + outList.length === 0 ? (
            <p className="text-[13px] text-[color:var(--a-muted)] py-3">
              Nenhum produto em estoque baixo. ✓
            </p>
          ) : (
            <table className="a-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th className="!text-right">Total</th>
                  <th>Variantes zeradas</th>
                </tr>
              </thead>
              <tbody>
                {[...outList, ...lowList].map((p) => {
                  const zeros = zeroVariants.filter(
                    (v) => v.product_id === p.id && v.products?.status === "active"
                  );
                  return (
                    <tr key={p.id}>
                      <td className="a-cellmain">
                        <Link href={`/admin/produtos/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="text-right tabular-nums font-semibold">
                        {p.total_stock ?? 0}
                      </td>
                      <td>
                        {zeros.length === 0 ? (
                          <span className="text-[color:var(--a-muted)]">—</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {zeros.map((v) => (
                              <span
                                key={v.id}
                                className="rounded-full bg-[color:var(--a-bg)] px-2 py-0.5 text-[11px] text-[color:var(--a-muted)]"
                              >
                                {[v.size, v.color].filter(Boolean).join(" / ") || "peça única"}
                              </span>
                            ))}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Atenção necessária */}
        <section className="a-card">
          <div className="a-cardtitle">
            Atenção necessária
            <span className="hint">{alerts.length} item(ns)</span>
          </div>
          {alerts.length === 0 ? (
            <p className="text-[13px] text-[color:var(--a-muted)] py-3">
              Tudo em ordem — nenhum produto precisa de atenção. ✓
            </p>
          ) : (
            alerts.map((a, i) => (
              <div
                key={i}
                className={`a-alertrow ${a.level === "danger" ? "dangercolor" : "warncolor"}`}
              >
                <Icon name={a.icon} size={16} />
                <span className="what">{a.text}</span>
                <Link href={a.action.href} className="a-btn secondary sm">
                  {a.action.label}
                </Link>
              </div>
            ))
          )}
        </section>

        {/* Maior interesse */}
        <section className="a-card">
          <div className="a-cardtitle">
            Produtos com maior interesse
            <span className="hint">últimos {days}d</span>
          </div>
          {perProduct.length === 0 ? (
            <p className="text-[13px] text-[color:var(--a-muted)] py-3">
              Sem visitas registradas ainda neste período.
            </p>
          ) : (
            <table className="a-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th className="!text-right">Vistas</th>
                  <th className="!text-right">Favs</th>
                  <th className="!text-right">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {perProduct.map((r) => (
                  <tr key={r.id}>
                    <td className="a-cellmain">
                      <Link href={`/admin/produtos/${r.id}`} className="hover:underline">
                        {nameOf(r.id)}
                      </Link>
                    </td>
                    <td className="text-right tabular-nums">{r.views}</td>
                    <td className="text-right tabular-nums">{r.favs}</td>
                    <td className="text-right tabular-nums font-semibold">{r.wa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Ações rápidas */}
      <section className="flex flex-wrap gap-2">
        <Link href="/admin/produtos/novo" className="a-btn">
          <Icon name="plus" size={15} /> Novo produto
        </Link>
        <Link href="/admin/produtos" className="a-btn secondary">
          <Icon name="package" size={15} /> Gerenciar produtos
        </Link>
        <Link href="/admin/banners" className="a-btn secondary">
          <Icon name="image" size={15} /> Adicionar banner
        </Link>
      </section>
    </div>
  );
}
