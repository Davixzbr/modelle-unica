import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getSiteConfig } from "@/lib/site-config";
import DashboardClient from "./DashboardClient";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const site = await getSiteConfig();

  const [prodRes, evRes] = await Promise.all([
    supabase.rpc("admin_products_with_stock", {
      p_order: "views",
      p_asc: false,
      p_limit: 500,
    }),
    supabase
      .from("events")
      .select("type, product_id, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()),
  ]);

  const products = (prodRes.data as unknown as Product[]) || [];
  const events = evRes.data || [];

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
      <DashboardClient products={products} events={events} lowStock={site.low_stock} />
    </>
  );
}
