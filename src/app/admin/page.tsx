import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getSiteConfig } from "@/lib/site-config";
import type { Product, ShopEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const site = await getSiteConfig();
  const since7d = new Date(Date.now() - 7 * 86400_000).toISOString();

  const [
    { count: total },
    { data: stockRows },
    { count: waClicks7d },
    { data: topViews },
    { data: topFavs },
    { data: topSearched },
    { data: recentClicks },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("product_stock_summary").select("product_id, total_stock"),
    supabase
      .from("whatsapp_clicks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since7d),
    supabase.from("products").select("id, name, slug, views").order("views", { ascending: false }).limit(5),
    supabase.from("products").select("id, name, slug, favorites_count").gt("favorites_count", 0).order("favorites_count", { ascending: false }).limit(5),
    supabase.from("events").select("term").eq("type", "search").gte("created_at", since7d),
    supabase.from("whatsapp_clicks").select("product_name, size, color, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const rows = stockRows || [];
  const semEstoque = rows.filter((r) => r.total_stock <= 0).length;
  const estoqueBaixo = rows.filter((r) => r.total_stock > 0 && r.total_stock <= site.low_stock).length;

  // Buscas mais frequentes (7d)
  const searchCount = new Map<string, number>();
  ((topSearched as Pick<ShopEvent, "term">[]) || []).forEach((e) => {
    if (e.term) searchCount.set(e.term, (searchCount.get(e.term) || 0) + 1);
  });
  const topSearches = [...searchCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">Dashboard</h1>
        <Link href="/admin/produtos/novo" className="a-btn">+ Adicionar produto</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="a-stat">
          <p className="lbl">Produtos cadastrados</p>
          <p className="num">{total ?? 0}</p>
        </div>
        <div className="a-stat">
          <p className="lbl">Esgotados</p>
          <p className="num" style={{ color: semEstoque ? "#b42318" : undefined }}>{semEstoque}</p>
        </div>
        <div className="a-stat">
          <p className="lbl">Estoque baixo (≤{site.low_stock})</p>
          <p className="num" style={{ color: estoqueBaixo ? "#b54708" : undefined }}>{estoqueBaixo}</p>
        </div>
        <div className="a-stat">
          <p className="lbl">Cliques WhatsApp (7d)</p>
          <p className="num">{waClicks7d ?? 0}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="a-card">
          <h2 className="mb-4 text-base">Mais vistos</h2>
          {topViews?.length ? (
            <ul className="divide-y divide-gray-100">
              {topViews.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{t.name}</span>
                  <span className="text-gray-500">{t.views} views</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Sem dados ainda.</p>
          )}
        </div>

        <div className="a-card">
          <h2 className="mb-4 text-base">Mais favoritados</h2>
          {topFavs?.length ? (
            <ul className="divide-y divide-gray-100">
              {topFavs.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{t.name}</span>
                  <span className="text-gray-500">♥ {t.favorites_count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              Ninguém favoritou ainda — o contador aparece aqui em tempo real.
            </p>
          )}
        </div>

        <div className="a-card">
          <h2 className="mb-4 text-base">Buscas frequentes (7d)</h2>
          {topSearches.length ? (
            <ul className="divide-y divide-gray-100">
              {topSearches.map(([term, n]) => (
                <li key={term} className="flex items-center justify-between py-2.5 text-sm">
                  <span>“{term}”</span>
                  <span className="text-gray-500">{n}x</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Sem buscas registradas ainda.</p>
          )}
        </div>
      </div>

      <div className="mt-4 a-card">
        <h2 className="mb-4 text-base">Últimos interesses (WhatsApp)</h2>
        {recentClicks?.length ? (
          <ul className="divide-y divide-gray-100">
            {recentClicks.map((c, i) => (
              <li key={i} className="py-2.5 text-sm">
                <span className="font-medium">{c.product_name || "—"}</span>
                <span className="text-gray-500">
                  {" "}· {c.size || "tam.—"}
                  {c.color ? ` · ${c.color}` : ""} ·{" "}
                  {new Date(c.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Nenhum clique registrado ainda.</p>
        )}
      </div>
    </>
  );
}
