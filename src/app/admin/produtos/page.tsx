import { Suspense } from "react";
import { createClient } from "@/lib/supabase-server";
import { getSiteConfig } from "@/lib/site-config";
import ProductsClient from "./ProductsClient";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const site = await getSiteConfig();
  const { data, error } = await supabase.rpc("admin_products_with_stock", {
    p_order: "sort_order",
    p_asc: true,
    p_limit: 500,
  });
  if (error) console.error("admin_products_with_stock:", error.message);

  return (
    <Suspense>
      <ProductsClient initial={(data as unknown as Product[]) || []} lowStock={site.low_stock} />
    </Suspense>
  );
}
