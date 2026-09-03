import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: total },
    { data: stockRows },
    { count: clicksHoje },
    { data: topViews },
    { data: recentClicks },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("product_stock_summary").select("product_id, total_stock"),
    supabase
      .from("whatsapp_clicks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString()),
    supabase
      .from("products")
      .select("id, name, slug, views")
      .order("views", { ascending: false })
      .limit(5),
    supabase
      .from("whatsapp_clicks")
      .select("product_name, size, color, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const rows = stockRows || [];
  const semEstoque = rows.filter((r) => r.total_stock <= 0).length;
  const estoqueBaixo = rows.filter((r) => r.total_stock > 0 && r.total_stock <= 4).length;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">Dashboard</h1>
        <Link href="/admin/produtos/novo" className="a-btn">
          + Adicionar produto
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="a-stat">
          <p className="lbl">Produtos cadastrados</p>
          <p className="num">{total ?? 0}</p>
        </div>
        <div className="a-stat">
          <p className="lbl">Esgotados</p>
          <p className="num" style={{ color: semEstoque ? "#b42318" : undefined }}>
            {semEstoque}
          </p>
        </div>
        <div className="a-stat">
          <p className="lbl">Estoque baixo</p>
          <p className="num" style={{ color: estoqueBaixo ? "#b54708" : undefined }}>
            {estoqueBaixo}
          </p>
        </div>
        <div className="a-stat">
          <p className="lbl">Cliques WhatsApp (7d)</p>
          <p className="num">{clicksHoje ?? 0}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="a-card">
          <h2 className="mb-4 text-base">Mais visualizados</h2>
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
          <h2 className="mb-4 text-base">Últimos interesses (WhatsApp)</h2>
          {recentClicks?.length ? (
            <ul className="divide-y divide-gray-100">
              {recentClicks.map((c, i) => (
                <li key={i} className="py-2.5 text-sm">
                  <span className="font-medium">{c.product_name || "—"}</span>
                  <span className="text-gray-500">
                    {" "}
                    · {c.size || "tam.—"}
                    {c.color ? ` · ${c.color}` : ""} ·{" "}
                    {new Date(c.created_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              Nenhum clique registrado ainda. Eles aparecem aqui em tempo real.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
