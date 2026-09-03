import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getSiteConfig } from "@/lib/site-config";
import DashboardClient from "./DashboardClient";
import type { Product } from "@/lib/types";

export type ZeroVariant = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock: number;
  products: { id: string; name: string; status: string } | null;
};

type StatsRow = {
  day: string;
  views: number;
  wa_orders: number;
  prev_views: number;
  prev_wa_orders: number;
};

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const site = await getSiteConfig();

  const [prodRes, evRes, varRes, statsRes] = await Promise.all([
    supabase.rpc("admin_products_with_stock", {
      p_order: "views",
      p_asc: false,
      p_limit: 500,
    }),
    supabase
      .from("events")
      .select("type, product_id, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()),
    // Drill-down de estoque: variantes zeradas (produto → tamanho/cor)
    supabase
      .from("variants")
      .select("id, product_id, size, color, stock, products!inner(id, name, status)")
      .lte("stock", 0)
      .limit(300),
    // Séries 30d p/ gráficos (RPC com is_admin interno)
    supabase.rpc("admin_stats_30d"),
  ]);

  const products = (prodRes.data as unknown as Product[]) || [];
  const events = evRes.data || [];
  const zeroVariants = (varRes.data as unknown as ZeroVariant[]) || [];
  // RPC retorna array de linhas; normaliza contra formato legado [[...]]
  // (setof json) e descarta linhas sem "day" — evita crash no render.
  const statsRaw = Array.isArray(statsRes.data) ? statsRes.data : [];
  const stats = (statsRaw as unknown[]).flat().filter(
    (r): r is StatsRow => !!r && typeof (r as StatsRow).day === "string"
  );

  return (
    <>
      <div className="a-pagehead">
        <div>
          <h1>Visão geral</h1>
          <p>O que está acontecendo na loja e o que precisa de você agora.</p>
        </div>
        <Link href="/admin/produtos/novo" className="a-btn">
          + Novo produto
        </Link>
      </div>
      <DashboardClient
        products={products}
        events={events}
        lowStock={site.low_stock}
        zeroVariants={zeroVariants}
        stats={stats}
      />
    </>
  );
}
