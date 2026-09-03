import { createClient } from "@/lib/supabase-server";
import type { Product, Banner } from "@/lib/types";

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

type OrderKey = "sort_order" | "created_at" | "views" | "favorites_count" | "price";

/**
 * Produtos ativos com estoque agregado, categoria e coleção.
 * Uma única chamada RPC (products_with_stock) — sem N+1 e sem embed frágil de views.
 */
export async function getShowcaseProducts(
  order: { column: OrderKey; ascending: boolean },
  limit = 8
): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("products_with_stock", {
    p_order: order.column,
    p_asc: order.ascending,
    p_limit: limit,
    p_slug: null,
  });
  if (error) {
    console.error("products_with_stock falhou:", error.message);
    return [];
  }
  return (data as unknown as Product[]) || [];
}

/** Produto individual por slug (para a página de detalhe). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("products_with_stock", {
    p_order: "sort_order",
    p_asc: true,
    p_limit: 1,
    p_slug: slug,
  });
  if (error || !data?.length) return null;
  return (data as unknown as Product[])[0] || null;
}
