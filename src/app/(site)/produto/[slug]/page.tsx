import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import ProductDetail from "./ProductDetail";
import ProductCard from "@/components/ProductCard";
import { getSiteConfig } from "@/lib/site-config";
import type { Product, Variant } from "@/lib/types";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, categories(name, slug), collections(name, slug)")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return data as Product | null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Produto não encontrado" };
  return {
    title: p.name,
    description: p.description,
    openGraph: {
      title: `${p.name} · Modelle Única`,
      description: p.description,
      images: p.images[0] ? [{ url: p.images[0] }] : undefined,
    },
  };
}

export default async function ProdutoPage({ params }: Params) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const supabase = await createClient();
  const site = await getSiteConfig();

  const [{ data: variants }, { data: related }] = await Promise.all([
    supabase.from("variants").select("*").eq("product_id", p.id),
    supabase
      .from("products")
      .select("*, categories(name, slug), variant_stocks(total_stock)")
      .eq("status", "active")
      .neq("id", p.id)
      .limit(4),
  ]);

  // Incremento de views (fire-and-forget, sem bloquear)
  supabase.rpc("increment_views", { product_id: p.id }).then(
    () => {},
    () => {}
  );

  const productUrl = `https://modelleunica.com.br/produto/${p.slug}`;

  return (
    <>
      <nav className="mx-auto max-w-6xl px-4 pt-6 text-[12px] text-ink-soft">
        <Link href="/catalogo" className="hover:text-caramel">Catálogo</Link>
        {p.categories && (
          <>
            {" / "}
            <Link href={`/catalogo?cat=${p.categories.slug}`} className="hover:text-caramel">
              {p.categories.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-ink">{p.name}</span>
      </nav>

      <ProductDetail
        product={p}
        variants={(variants as Variant[]) || []}
        siteName={site.name}
        whatsapp={site.whatsapp}
        productUrl={productUrl}
      />

      {/* Relacionados */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display mb-8 text-2xl text-ink">Combine com</h2>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {(related as Product[])?.map((r) => (
            <ProductCard key={r.id} p={r} />
          ))}
        </div>
      </section>
    </>
  );
}
