import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import CatalogClient from "./CatalogClient";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Vitrine completa Modelle Única: conjuntos, camisetas, regatas e shorts com curadoria autêntica.",
};

export const revalidate = 60;

export default async function CatalogoPage() {
  const supabase = await createClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(name, slug), variant_stocks(total_stock)")
      .order("sort_order"),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  return (
    <Suspense>
      <CatalogClient
        products={(products as Product[]) || []}
        categories={categories || []}
      />
    </Suspense>
  );
}
