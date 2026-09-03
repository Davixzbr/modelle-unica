"use client";

import { useMemo, useState } from "react";

export type Stats30d = {
  day: string;
  views: number;
  wa_orders: number;
  prev_views: number;
  prev_wa_orders: number;
};

/** Setinha ↑/↓ + % de variação vs. período anterior. */
function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (prev === 0 && cur === 0) return <span className="text-xs opacity-50">—</span>;
  const diff = cur - prev;
  const pct = prev === 0 ? 100 : Math.round((diff / prev) * 100);
  const up = diff >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
        up ? "text-emerald-600" : "text-red-500"
      }`}
      title={`${cur} vs. ${prev} no período anterior`}
    >
      {up ? "↑" : "↓"} {Math.abs(pct)}%
    </span>
  );
}

/**
 * Gráficos SVG puros (sem lib): barras finas de views e wa_order por dia
 * (últimos 30d) com hover tooltip + resumo comparativo vs. 30d anteriores.
 */
export default function AdminCharts({ stats }: { stats: Stats30d[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const totals = useMemo(() => {
    const views = stats.reduce((s, d) => s + d.views, 0);
    const wa = stats.reduce((s, d) => s + d.wa_orders, 0);
    const pv = stats.reduce((s, d) => s + d.prev_views, 0);
    const pw = stats.reduce((s, d) => s + d.prev_wa_orders, 0);
    return { views, wa, pv, pw };
  }, [stats]);

  const maxV = Math.max(1, ...stats.map((d) => d.views));
  const maxW = Math.max(1, ...stats.map((d) => d.wa_orders));
  const W = 720;
  const H = 120;
  const n = Math.max(1, stats.length);
  const bw = W / n;

  if (stats.length === 0) {
    return (
      <p className="py-3 text-[13px] text-[color:var(--a-muted)]">
        Sem dados de eventos nos últimos 30 dias.
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      {/* Resumo comparativo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[color:var(--a-line)] bg-[color:var(--a-bg)] p-4">
          <p className="text-[12px] uppercase tracking-wider text-[color:var(--a-muted)]">
            Visualizações · 30d
          </p>
          <p className="mt-1 flex items-baseline gap-3">
            <span className="text-2xl font-semibold tabular-nums">{totals.views}</span>
            <Delta cur={totals.views} prev={totals.pv} />
          </p>
        </div>
        <div className="rounded-xl border border-[color:var(--a-line)] bg-[color:var(--a-bg)] p-4">
          <p className="text-[12px] uppercase tracking-wider text-[color:var(--a-muted)]">
            Pedidos WhatsApp · 30d
          </p>
          <p className="mt-1 flex items-baseline gap-3">
            <span className="text-2xl font-semibold tabular-nums">{totals.wa}</span>
            <Delta cur={totals.wa} prev={totals.pw} />
          </p>
        </div>
      </div>

      {/* Barras diárias — views */}
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[color:var(--a-muted)]">
          Visualizações por dia
        </p>
        <svg
          viewBox={`0 0 ${W} ${H + 18}`}
          className="w-full"
          role="img"
          aria-label={`Visualizações por dia, últimos ${n} dias. Total ${totals.views}.`}
        >
          {stats.map((d, i) => {
            const h = (d.views / maxV) * (H - 10);
            const x = i * bw + bw * 0.18;
            const w = bw * 0.64;
            return (
              <g key={d.day}>
                <rect
                  x={x}
                  y={H - h}
                  width={w}
                  height={Math.max(h, d.views > 0 ? 2 : 0)}
                  rx={2}
                  className="fill-[color:var(--a-accent)] transition-opacity"
                  opacity={hover === null || hover === i ? 0.9 : 0.35}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
                {hover === i && (
                  <g>
                    <rect
                      x={Math.min(x + w / 2 - 46, W - 96)}
                      y={Math.max(H - h - 34, 0)}
                      width="92"
                      height="24"
                      rx="5"
                      className="fill-[color:var(--a-ink, #222)]"
                      opacity="0.92"
                    />
                    <text
                      x={Math.min(x + w / 2, W - 50)}
                      y={Math.max(H - h - 17, 16)}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#fff"
                    >
                      {d.day.slice(8, 10)}/{d.day.slice(5, 7)} · {d.views}
                    </text>
                  </g>
                )}
                {(i % 6 === 0 || i === n - 1) && (
                  <text x={x + w / 2} y={H + 14} textAnchor="middle" fontSize="9" className="fill-[color:var(--a-muted)]">
                    {d.day.slice(8, 10)}/{d.day.slice(5, 7)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Barras diárias — wa_order */}
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[color:var(--a-muted)]">
          Pedidos WhatsApp por dia
        </p>
        <svg
          viewBox={`0 0 ${W} ${H + 18}`}
          className="w-full"
          role="img"
          aria-label={`Pedidos WhatsApp por dia, últimos ${n} dias. Total ${totals.wa}.`}
        >
          {stats.map((d, i) => {
            const h = (d.wa_orders / maxW) * (H - 10);
            const x = i * bw + bw * 0.18;
            const w = bw * 0.64;
            return (
              <g key={d.day}>
                <rect
                  x={x}
                  y={H - h}
                  width={w}
                  height={Math.max(h, d.wa_orders > 0 ? 2 : 0)}
                  rx={2}
                  className="fill-emerald-600 transition-opacity"
                  opacity={hover === null || hover === i ? 0.9 : 0.35}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
                {hover === i && (
                  <g>
                    <rect
                      x={Math.min(x + w / 2 - 46, W - 96)}
                      y={Math.max(H - h - 34, 0)}
                      width="92"
                      height="24"
                      rx="5"
                      className="fill-[color:var(--a-ink, #222)]"
                      opacity="0.92"
                    />
                    <text
                      x={Math.min(x + w / 2, W - 50)}
                      y={Math.max(H - h - 17, 16)}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#fff"
                    >
                      {d.day.slice(8, 10)}/{d.day.slice(5, 7)} · {d.wa_orders}
                    </text>
                  </g>
                )}
                {(i % 6 === 0 || i === n - 1) && (
                  <text x={x + w / 2} y={H + 14} textAnchor="middle" fontSize="9" className="fill-[color:var(--a-muted)]">
                    {d.day.slice(8, 10)}/{d.day.slice(5, 7)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
