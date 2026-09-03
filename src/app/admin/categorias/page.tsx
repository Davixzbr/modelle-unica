import { createClient } from "@/lib/supabase-server";
import CategoriesClient from "./CategoriesClient";
import type { Categorie } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const [{ data: cats }, { data: prods }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products").select("category_id").eq("status", "active"),
  ]);

  const counts: Record<string, number> = {};
  for (const p of prods || []) {
    if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
  }

  return <CategoriesClient initialCats={(cats as unknown as Categorie[]) || []} counts={counts} />;
}
