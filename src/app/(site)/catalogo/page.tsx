import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { getSiteConfig } from "@/lib/site-config";
import CatalogClient from "./CatalogClient";
import { ProductGridSkeleton } from "@/components/States";
import { PRODUCT_SELECT } from "@/lib/types";
import type { Product, Categorie, Collection } from "@/lib/types";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Vitrine completa Modelle Única: conjuntos, camisetas, regatas e shorts com curadoria autêntica.",
  alternates: { canonical: "/catalogo" },
};

export const revalidate = 60;

export default async function CatalogoPage() {
  const supabase = await createClient();
  const site = await getSiteConfig();

  const [{ data: products }, { data: categories }, { data: collections }] = await Promise.all([
    supabase.from("products").select(PRODUCT_SELECT).eq("status", "active").order("sort_order"),
    supabase.from("categories").select("id, name, slug").eq("active", true).order("sort_order"),
    supabase.from("collections").select("id, name, slug").eq("active", true).order("name"),
  ]);

  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-14"><ProductGridSkeleton /></div>}>
      <CatalogClient
        products={(products as Product[]) || []}
        categories={(categories as Categorie[]) || []}
        collections={(collections as Collection[]) || []}
        lowStock={site.low_stock}
      />
    </Suspense>
  );
}
