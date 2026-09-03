import { createClient } from "@/lib/supabase-server";
import FeaturedClient from "./FeaturedClient";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminFeaturedPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_products_with_stock", {
    p_order: "sort_order",
    p_asc: true,
    p_limit: 500,
  });
  return <FeaturedClient initial={(data as unknown as Product[]) || []} />;
}
