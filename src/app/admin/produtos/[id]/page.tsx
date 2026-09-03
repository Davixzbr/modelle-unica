import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import ProductForm from "@/components/admin/ProductForm";
import type { Product, Variant, Categorie, Collection } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: variants }, { data: categories }, { data: collections }] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase.from("variants").select("*").eq("product_id", id),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("collections").select("*").order("name"),
    ]);

  if (!product) notFound();

  return (
    <ProductForm
      product={product as Product}
      variants={(variants as Variant[]) || []}
      categories={(categories as Categorie[]) || []}
      collections={(collections as Collection[]) || []}
    />
  );
}
