import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { getActiveBanners, getShowcaseProducts } from "@/lib/queries";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import Testimonials, { TrustBadges, type Depoimento } from "@/components/Testimonials";
import Icon from "@/components/Icon";
import { getSetting, getSiteConfig } from "@/lib/site-config";
import { waLink, waNumber } from "@/lib/format";
import type { Categorie } from "@/lib/types";

export const revalidate = 60;

const MARQUEE = [
  "Peças únicas",
  "Atendimento pelo WhatsApp",
  "Edições limitadas",
  "Troca facilitada",
  "Estilo autoral",
];

export default async function HomePage() {
  const supabase = await createClient();
  const site = await getSiteConfig();
  const about = await getSetting("about");
  const depoimentosRaw = await getSetting("depoimentos");

  const [banners, novos, maisVendidos, { data: cats }] = await Promise.all([
    getActiveBanners(),
    getShowcaseProducts({ column: "created_at", ascending: false }, 4),
    getShowcaseProducts({ column: "views", ascending: false }, 4),
    supabase.from("categories").select("*").eq("active", true).order("sort_order"),
  ]);

  const catImages: Record<string, string> = {
    conjuntos: "/images/look-002.jpg",
    "camisetas-regatas": "/images/look-008.jpg",
    shorts: "/images/look-005.jpg",
  };
  const categories = (cats as Categorie[]) || [];
  const depoimentos = (depoimentosRaw as unknown as Depoimento[] | null) || [];
  const ctaWa = waLink(
    waNumber(site.whatsapp),
    `Olá, ${site.name}! Vim pelo site e quero conhecer as novidades.`
  );

  return (
    <>
      <HeroCarousel banners={banners} />

      {/* Marquee editorial — valores da marca */}
      <div className="marquee border-b border-line bg-paper py-3.5" aria-hidden>
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span
              key={i}
              className="flex items-center gap-16 text-[11px] uppercase tracking-[0.28em] text-ink-faint"
            >
              {t}
              <span className="inline-block h-1 w-1 rotate-45 bg-gold/60" />
            </span>
          ))}
        </div>
      </div>

      {/* ---------- NOVIDADES ---------- */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:py-24">
        <Reveal className="mb-12 flex items-end justify-between">
          <div>
            <p className="kicker">Recém-chegadas</p>
            <h2 className="font-display mt-2 text-3xl text-ink sm:text-[42px]">Novidades</h2>
          </div>
          <Link href="/catalogo" className="btn-underline hidden sm:inline-block">
            Ver tudo
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
          {novos.map((p, i) => (
            <Reveal key={p.id} delayMs={i * 60}>
              <ProductCard p={p} lowStock={site.low_stock} />
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 text-center sm:hidden">
          <Link href="/catalogo" className="btn btn-outline">
            Ver catálogo completo
          </Link>
        </Reveal>
      </section>

      {/* ---------- FAIXA EDITORIAL — full-bleed + frase da marca ---------- */}
      <section className="relative min-h-[380px] overflow-hidden sm:min-h-[46vh]">
        <Image
          src="/images/look-008.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/45" aria-hidden />
        <div className="absolute inset-0 grid place-items-center px-6">
          <Reveal className="text-center">
            <p className="font-display text-4xl italic leading-tight text-cream sm:text-6xl">
              {site.tagline || (about?.title as string) || "Esteja sempre em movimento."}
            </p>
            <span className="mx-auto mt-6 block h-px w-14 bg-gold" aria-hidden />
          </Reveal>
        </div>
      </section>

      {/* ---------- MAIS VENDIDOS (por views) ---------- */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:py-24">
        <Reveal className="mb-12 flex items-end justify-between">
          <div>
            <p className="kicker">As amadas da casa</p>
            <h2 className="font-display mt-2 text-3xl text-ink sm:text-[42px]">
              Mais vendidos
            </h2>
          </div>
          <Link href="/catalogo?ord=views" className="btn-underline hidden sm:inline-block">
            Ver ranking completo
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
          {maisVendidos.map((p, i) => (
            <Reveal key={p.id} delayMs={i * 60}>
              <ProductCard p={p} lowStock={site.low_stock} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- COLEÇÕES — cards c/ banner ---------- */}
      {categories.length > 0 && (
        <section className="border-y border-line bg-sand/50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5">
            <Reveal className="mb-12 text-center">
              <p className="kicker">Explore</p>
              <h2 className="font-display mt-2 text-3xl text-ink sm:text-[42px]">
                Escolha por categoria
              </h2>
            </Reveal>
            <Reveal
              className={`grid gap-5 ${
                categories.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
              }`}
            >
              {categories.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/catalogo?cat=${c.slug}`}
                  className={`zoom-frame group relative overflow-hidden ${
                    i === 0 && categories.length >= 3 ? "sm:aspect-[4/5]" : "aspect-[4/5] sm:aspect-auto sm:min-h-[420px]"
                  }`}
                >
                  <Image
                    src={c.image_url || catImages[c.slug] || "/images/look-001.jpg"}
                    alt={c.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
                  <div className="absolute inset-x-6 bottom-6">
                    <h3 className="font-display text-[26px] leading-tight text-cream sm:text-3xl">
                      {c.name}
                    </h3>
                    {c.description && (
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-cream/70">
                        {c.description}
                      </p>
                    )}
                    <p className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-cream/80 transition-colors group-hover:text-gold-soft">
                      Descobrir
                      <Icon
                        name="arrowRight"
                        size={13}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </p>
                  </div>
                </Link>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- DEPOIMENTOS ---------- */}
      <Testimonials items={depoimentos} />

      {/* ---------- SELOS DE CONFIANÇA ---------- */}
      <div className="border-b border-line bg-paper">
        <TrustBadges />
      </div>

      {/* ---------- CTA WHATSAPP ---------- */}
      <section className="mx-auto max-w-7xl px-5 py-24 text-center">
        <Reveal>
          <div className="hairline mx-auto mb-8 max-w-xs">
            <span aria-hidden />
          </div>
          <Icon name="whatsapp" size={28} className="mx-auto text-moss" strokeWidth={1.3} />
          <h2 className="font-display mt-5 text-3xl text-ink sm:text-[42px]">
            Compre pelo WhatsApp
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
            Tire dúvidas de medidas e caimento, veja peças exclusivas e receba seu
            pedido — atendimento humano, sem robô.
          </p>
          <a
            href={ctaWa}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex items-center gap-2.5 rounded-full bg-ink px-9 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-cream transition-all hover:bg-gold-deep"
          >
            <Icon name="whatsapp" size={16} />
            Chamar no WhatsApp
          </a>
          <p className="mt-6 text-[13px] text-ink-faint">
            Ou siga {" "}
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-deep underline underline-offset-2"
            >
              {site.instagramHandle}
            </a>{" "}
            para lançamentos em primeira mão.
          </p>
        </Reveal>
      </section>
    </>
  );
}
