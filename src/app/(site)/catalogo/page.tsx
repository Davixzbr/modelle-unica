import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { getSiteConfig } from "@/lib/site-config";
import { getShowcaseProducts } from "@/lib/queries";
import CatalogClient from "./CatalogClient";
import { ProductGridSkeleton } from "@/components/States";
import type { Product, Categorie, Collection } from "@/lib/types";
import { SITE_URL } from "@/lib/env";

type Search = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Search;
}): Promise<Metadata> {
  const sp = await searchParams;
  const cat = first(sp.cat);
  const q = first(sp.q);
  const tag = first(sp.tag);

  let title = "Catálogo";
  const supabase = await createClient();
  if (cat) {
    const { data } = await supabase
      .from("categories")
      .select("name")
      .eq("slug", cat)
      .single();
    if (data?.name) title = `${data.name} — Catálogo`;
  }
  if (tag) title = `${tag === "promocao" ? "Promoções" : tag[0].toUpperCase() + tag.slice(1)} — Catálogo`;
  if (q) title = `Busca: ${q}`;

  const description = q
    ? `Resultados para “${q}” no catálogo Modelle Única — moda fitness com curadoria autêntica.`
    : "Vitrine completa Modelle Única: conjuntos, camisetas, regatas e shorts com curadoria autêntica. Compre pelo WhatsApp.";

  return {
    title,
    description,
    alternates: {
      canonical: cat ? `${SITE_URL}/catalogo?cat=${cat}` : "/catalogo",
    },
    openGraph: { title: `${title} · Modelle Única`, description },
    robots: q ? { index: false, follow: true } : undefined,
  };
}

export const revalidate = 60;

export default async function CatalogoPage() {
  const supabase = await createClient();
  const site = await getSiteConfig();

  const [produtos, { data: categories }, { data: collections }] = await Promise.all([
    getShowcaseProducts({ column: "sort_order", ascending: true }, 500),
    supabase.from("categories").select("id, name, slug").eq("active", true).order("sort_order"),
    supabase.from("collections").select("id, name, slug").eq("active", true).order("name"),
  ]);

  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-14"><ProductGridSkeleton /></div>}>
      <CatalogClient
        products={produtos}
        categories={(categories as Categorie[]) || []}
        collections={(collections as Collection[]) || []}
        lowStock={site.low_stock}
      />
    </Suspense>
  );
}
