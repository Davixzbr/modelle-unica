"use client";

import { useMemo, useState } from "react";
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
    return list;
  }, [clicks, product, period]);

  // Resumo por produto no período filtrado
  const summary = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((c) => {
      if (c.product_name) m.set(c.product_name, (m.get(c.product_name) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  return (
    <>
      <h1 className="mb-1 text-2xl">Interesses (cliques no WhatsApp)</h1>
      <p className="mb-6 text-sm text-gray-500">
        Cada clique em "Comprar pelo WhatsApp" registra produto, tamanho e cor — sua demanda em
        tempo real, sem checkout.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={product} onChange={(e) => setProduct(e.target.value)} style={{ width: 240 }} aria-label="Filtrar por produto">
          <option value="">Todos os produtos</option>
          {products.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: 160 }} aria-label="Período">
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="all">Todo o histórico</option>
        </select>
        <span className="text-sm text-gray-500">{filtered.length} registro(s)</span>
      </div>

      {summary.length > 1 && (
        <div className="a-card mb-4">
          <h2 className="mb-3 text-base">Resumo no período</h2>
          <ul className="divide-y divide-gray-100">
            {summary.slice(0, 8).map(([name, n]) => (
              <li key={name} className="flex justify-between py-2 text-sm">
                <span>{name}</span>
                <span className="font-semibold">{n} clique(s)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
              <td className="whitespace-nowrap text-gray-600">{fmtDate(c.created_at)}</td>
              <td className="font-medium">{c.product_name || "—"}</td>
              <td>{c.size || "—"}</td>
              <td>{c.color || "—"}</td>
            </tr>
          ))}
          {!filtered.length && (
            <tr>
              <td colSpan={4} className="py-10 text-center text-gray-500">
                Nenhum clique registrado neste período.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
