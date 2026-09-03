import { createClient } from "@/lib/supabase-server";
import { getSiteConfig } from "@/lib/site-config";
import { PRODUCT_SELECT } from "@/lib/types";
import type { Banner, Product } from "@/lib/types";

/** Banners ativos e dentro do período de exibição. */
export async function getActiveBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  const now = new Date();
  return ((data as Banner[]) || []).filter(
    (b) =>
      (!b.starts_at || new Date(b.starts_at) <= now) &&
      (!b.ends_at || new Date(b.ends_at) >= now)
  );
}

/** Consulta padrão de produtos da vitrine (ativos, com estoque agregado). */
export async function getShowcaseProducts(order: {
  column: string;
  ascending: boolean;
}, limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "active")
    .order(order.column, { ascending: order.ascending })
    .limit(limit);
  return (data as Product[]) || [];
}
