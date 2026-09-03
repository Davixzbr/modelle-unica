import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getActiveBanners, getShowcaseProducts } from "@/lib/queries";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { getSetting, getSiteConfig } from "@/lib/site-config";
import { PRODUCT_SELECT } from "@/lib/types";
import type { Product, Categorie } from "@/lib/types";
import Image from "next/image";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();
  const site = await getSiteConfig();
  const about = await getSetting("about");

  const [banners, novos, destaques, { data: cats }] = await Promise.all([
    getActiveBanners(),
    getShowcaseProducts({ column: "created_at", ascending: false }, 4),
    getShowcaseProducts({ column: "views", ascending: false }, 4).then(async (fallback) => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("status", "active")
        .eq("featured", true)
        .limit(4);
      return ((data as Product[])?.length ? (data as Product[]) : fallback) || [];
    }),
    supabase.from("categories").select("*").eq("active", true).order("sort_order"),
  ]);

  const catImages: Record<string, string> = {
    conjuntos: "/images/look-002.jpg",
    "camisetas-regatas": "/images/look-008.jpg",
    shorts: "/images/look-005.jpg",
  };

  return (
    <>
      <HeroCarousel banners={banners} />

      {/* ---------- NOVIDADES ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-caramel">Recém-chegadas</p>
            <h2 className="font-display mt-2 text-3xl text-ink sm:text-4xl">Novidades</h2>
          </div>
          <Link
            href="/catalogo"
            className="hidden text-[12px] uppercase tracking-widest text-ink-soft underline-offset-4 hover:text-caramel hover:underline sm:block"
          >
            Ver tudo
          </Link>
        </Reveal>
        <Reveal className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
          {novos.map((p) => (
            <ProductCard key={p.id} p={p} lowStock={site.low_stock} />
          ))}
        </Reveal>
      </section>

      {/* ---------- CATEGORIAS ---------- */}
      <section className="border-y border-line bg-sand/60 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mb-10 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-caramel">Explore</p>
            <h2 className="font-display mt-2 text-3xl text-ink sm:text-4xl">
              Escolha por categoria
            </h2>
          </Reveal>
          <Reveal className="grid gap-5 sm:grid-cols-3">
            {(cats as Categorie[])?.map((c) => (
              <Link
                key={c.id}
                href={`/catalogo?cat=${c.slug}`}
                className="zoom-frame group relative aspect-[4/5] overflow-hidden"
              >
                <Image
                  src={c.image_url || catImages[c.slug] || "/images/look-001.jpg"}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="font-display text-2xl text-cream">{c.name}</p>
                  {c.description && (
                    <p className="mt-1 hidden text-xs text-cream/70 group-hover:block">{c.description}</p>
                  )}
                  <p className="mt-1 text-[11px] uppercase tracking-widest text-cream/70">
                    Descobrir →
                  </p>
                </div>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ---------- DESTAQUES ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-caramel">Curadoria da casa</p>
          <h2 className="font-display mt-2 text-3xl text-ink sm:text-4xl">Destaques</h2>
        </Reveal>
        <Reveal className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
          {destaques.map((p) => (
            <ProductCard key={p.id} p={p} lowStock={site.low_stock} />
          ))}
        </Reveal>
      </section>

      {/* ---------- SOBRE ---------- */}
      <section className="noise relative overflow-hidden bg-ink py-24 text-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-caramel">A marca</p>
            <h2 className="font-display mt-3 text-3xl leading-tight sm:text-4xl">
              {(about?.title as string) || "Sobre a Modelle Única"}
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-cream/75">
              {(about?.text as string) ||
                "Peças selecionadas uma a uma, com caimento, qualidade e atitude."}
            </p>
            <Link
              href="/sobre"
              className="mt-8 inline-block rounded-full border border-cream/30 px-7 py-3 text-[12px] font-semibold uppercase tracking-widest transition-all hover:border-caramel hover:bg-caramel hover:text-white"
            >
              Conheça nossa história
            </Link>
          </Reveal>
          <Reveal className="zoom-frame relative aspect-[4/5]">
            <Image
              src="/images/look-010.jpg"
              alt="Sobre a Modelle Única"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* ---------- INSTAGRAM ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.3em] text-caramel">
            {site.instagramHandle.replace("@", "")}
          </p>
          <h2 className="font-display mt-2 text-3xl text-ink sm:text-4xl">
            Siga-nos no Instagram
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
            Lançamentos, bastidores e combinações em primeira mão — direto no seu feed.
          </p>
          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-full bg-ink px-10 py-3.5 text-[12px] font-semibold uppercase tracking-widest text-cream transition-all hover:bg-caramel"
          >
            Seguir {site.instagramHandle}
          </a>
        </Reveal>
      </section>
    </>
  );
}
