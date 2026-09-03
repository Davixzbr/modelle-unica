import { Suspense } from "react";
import { createClient } from "@/lib/supabase-server";
import { getSiteConfig } from "@/lib/site-config";
import ProductsClient from "./ProductsClient";
import { PRODUCT_SELECT } from "@/lib/types";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const site = await getSiteConfig();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("sort_order");

  return (
    <Suspense>
      <ProductsClient
        initial={(data as Product[]) || []}
        lowStock={site.low_stock}
      />
    </Suspense>
  );
}
