import { createClient } from "@/lib/supabase-server";
import ProductForm from "@/components/admin/ProductForm";
import type { Categorie, Collection } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: collections }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("collections").select("*").order("name"),
  ]);

  return (
    <ProductForm
      product={null}
      variants={[]}
      categories={(categories as Categorie[]) || []}
      collections={(collections as Collection[]) || []}
    />
  );
}
