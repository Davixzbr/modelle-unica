import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getSiteConfig } from "@/lib/site-config";
import { getProductBySlug } from "@/lib/queries";
import { logEvent } from "@/lib/analytics";
import ProductDetail from "./ProductDetail";
import ProductCard from "@/components/ProductCard";
import type { Product, Variant } from "@/lib/types";
import { SITE_URL } from "@/lib/env";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Produto não encontrado" };
  const image = p.main_image || p.images[0];
  const description = p.short_description || p.description.slice(0, 160);
  return {
    title: p.name,
    description,
    alternates: { canonical: `${SITE_URL}/produto/${p.slug}` },
    openGraph: {
      title: `${p.name} · Modelle Única`,
      description,
      images: image ? [{ url: image }] : undefined,
      type: "website",
    },
  };
}

export default async function ProdutoPage({ params }: Params) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const supabase = await createClient();
  const site = await getSiteConfig();

  const [{ data: variants }, { data: related }] = await Promise.all([
    supabase.from("variants").select("*").eq("product_id", p.id),
    supabase.from("products").select("*").eq("status", "active").neq("id", p.id).order("sort_order").limit(4),
  ]);

  // Evento de visualização + contador (fire-and-forget)
  logEvent("view", { product_id: p.id });
  supabase.rpc("increment_views", { product_id: p.id }).then(
    () => {},
    () => {}
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.short_description || p.description,
    image: (p.main_image ? [p.main_image, ...p.images] : p.images).slice(0, 4),
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      price: p.promo_price ?? p.price,
      priceCurrency: "BRL",
      availability:
        p.total_stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/produto/${p.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mx-auto max-w-6xl px-4 pt-6 text-[12px] text-ink-soft" aria-label="Trilha">
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
        <span className="text-ink" aria-current="page">{p.name}</span>
      </nav>

      <ProductDetail
        product={p}
        variants={(variants as Variant[]) || []}
        siteName={site.name}
        whatsapp={site.whatsapp}
        lowStock={site.low_stock}
      />

      {/* Relacionados */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display mb-8 text-2xl text-ink">Combine com</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
          {((related as Product[]) || []).map((r) => (
            <ProductCard key={r.id} p={r} lowStock={site.low_stock} />
          ))}
        </div>
      </section>
    </>
  );
}
