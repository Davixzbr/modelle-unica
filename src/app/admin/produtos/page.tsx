import { Suspense } from "react";
import { createClient } from "@/lib/supabase-server";
import ProductsClient from "./ProductsClient";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("sort_order");

  return (
    <Suspense>
      <ProductsClient initial={(data as Product[]) || []} />
    </Suspense>
  );
}
