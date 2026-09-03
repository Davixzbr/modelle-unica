import { Suspense, cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getSiteConfig } from "@/lib/site-config";
import { getProductBySlug } from "@/lib/queries";
import { logEvent } from "@/lib/analytics";
import ProductDetail from "./ProductDetail";
import ProductCard from "@/components/ProductCard";
import ProductDetailSkeleton from "@/components/ProductDetailSkeleton";
import type { Product, Variant } from "@/lib/types";
import { SITE_URL } from "@/lib/env";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

/** Dedup: metadata + gate 404 + body compartilham a mesma query por render. */
const getProductCached = cache(getProductBySlug);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductCached(slug);
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

/** Corpo da página (produto já resolvido e validado — skeleton cobre o resto). */
async function ProdutoBody({ p }: { p: Product }) {
  const supabase = await createClient();
  const site = await getSiteConfig();

  // "Combina com": mesma coleção (fallback: mesma categoria), máx 4, exclui o atual.
  const { data: pool } = await supabase.rpc("products_with_stock", {
    p_order: "sort_order",
    p_asc: true,
    p_limit: 500,
    p_slug: null,
  });
  const candidates = ((pool as unknown as Product[]) || []).filter((r) => r.id !== p.id);
  const sameCollection = candidates.filter((r) => r.collection_id === p.collection_id);
  const related =
    sameCollection.length > 0
      ? sameCollection.slice(0, 4)
      : candidates.filter((r) => r.category_id === p.category_id).slice(0, 4);

  const { data: variants } = await supabase
    .from("variants")
    .select("*")
    .eq("product_id", p.id);

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

      {/* Combina com — carrossel horizontal com scroll-snap */}
      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display mb-8 text-2xl text-ink">Combina com</h2>
          <div
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4"
            role="list"
            aria-label="Produtos que combinam"
          >
            {related.map((r) => (
              <div
                key={r.id}
                role="listitem"
                className="w-[46vw] flex-none snap-start sm:w-[30vw] lg:w-[calc(25%-12px)]"
              >
                <ProductCard p={r} lowStock={site.low_stock} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default async function ProdutoPage({ params }: Params) {
  const { slug } = await params;
  // 404 real: resolve antes de qualquer flush do streaming.
  const p = await getProductCached(slug);
  if (!p) notFound();
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProdutoBody p={p} />
    </Suspense>
  );
}
