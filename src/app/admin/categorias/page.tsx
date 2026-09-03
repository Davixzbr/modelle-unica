import { createClient } from "@/lib/supabase-server";
import CategoriesClient from "./CategoriesClient";
import type { Categorie, Collection } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const [{ data: cats }, { data: cols }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("collections").select("*").order("name"),
  ]);

  return (
    <CategoriesClient
      initialCats={(cats as Categorie[]) || []}
      initialCols={(cols as Collection[]) || []}
    />
  );
}
