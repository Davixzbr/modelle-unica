"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import { fmtDate } from "@/lib/format";
import type { ClickLog } from "@/lib/types";

export default function ClicksClient({ initial }: { initial: ClickLog[] }) {
  const [clicks] = useState(initial);
  const [product, setProduct] = useState("");
  const [period, setPeriod] = useState("30");

  const products = useMemo(
    () => [...new Set(clicks.map((c) => c.product_name).filter(Boolean))] as string[],
    [clicks]
  );

  const filtered = useMemo(() => {
    let list = [...clicks];
    if (product) list = list.filter((c) => c.product_name === product);
    if (period !== "all") {
      const since = Date.now() - Number(period) * 86400_000;
      list = list.filter((c) => +new Date(c.created_at) >= since);
    }
    return list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [clicks, product, period]);

  const summary = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((c) => {
      if (c.product_name) m.set(c.product_name, (m.get(c.product_name) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const maxSummary = Math.max(1, ...summary.map((s) => s[1]));

  return (
    <>
      <div className="a-pagehead">
        <div>
          <h1>Interesses</h1>
          <p>
            Cada clique em “Comprar pelo WhatsApp” registra produto, tamanho e cor — demanda real
            sem checkout.
          </p>
        </div>
      </div>

      <div className="a-toolbar">
        <select
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          aria-label="Filtrar por produto"
        >
          <option value="">Todos os produtos</option>
          {products.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Período">
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="all">Todo o histórico</option>
        </select>
        <span className="ml-auto text-[13px] text-[color:var(--a-muted)]">
          {filtered.length} registro(s)
        </span>
      </div>

      {summary.length > 0 && (
        <section className="a-card mb-5">
          <div className="a-cardtitle">Resumo no período</div>
          <div className="grid gap-2.5">
            {summary.slice(0, 8).map(([name, n]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="font-medium">{name}</span>
                  <span className="tabular-nums text-[color:var(--a-muted)]">{n}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--a-bg)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--a-accent)]"
                    style={{ width: `${(n / maxSummary) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="a-tablewrap">
        {filtered.length === 0 ? (
          <div className="a-empty">
            <div className="ic">
              <Icon name="message" size={36} />
            </div>
            <div className="t">Nenhum clique registrado neste período</div>
            <p>Assim que clientes tocarem em “Comprar pelo WhatsApp”, aparece aqui.</p>
          </div>
        ) : (
          <table className="a-table">
            <thead>
              <tr>
                <th>Data / hora</th>
                <th>Produto</th>
                <th>Tamanho</th>
                <th>Cor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap text-[color:var(--a-muted)]">
                    {fmtDate(c.created_at)}
                  </td>
                  <td className="a-cellmain">{c.product_name || "—"}</td>
                  <td>{c.size || "—"}</td>
                  <td>{c.color || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
