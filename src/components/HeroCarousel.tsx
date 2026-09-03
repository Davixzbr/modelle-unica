"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import { logEvent } from "@/lib/analytics";
import type { Banner } from "@/lib/types";

export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [idx, setIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 6500);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <section
      className="relative h-[86svh] min-h-[520px] w-full overflow-hidden bg-ink sm:h-[92svh]"
      aria-roledescription="carrossel"
      aria-label="Banners em destaque"
    >
      {banners.map((b, i) => {
        const src = isMobile && b.image_mobile_url ? b.image_mobile_url : b.image_url;
        return (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-[1100ms] ease-out ${
              i === idx ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={i !== idx}
          >
            <Image
              src={src}
              alt={b.title || "Banner"}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            {/* overlay mínimo: apenas gradiente na base p/ texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/10" />

            <div className="absolute inset-x-0 bottom-0">
              <div className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 sm:pb-20">
                <div className="max-w-2xl">
                  {b.subtitle && (
                    <p className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cream/75">
                      <span className="inline-block h-px w-8 bg-gold" aria-hidden />
                      {b.subtitle}
                    </p>
                  )}
                  <h1 className="font-display text-[34px] leading-[1.08] text-cream sm:text-6xl md:text-7xl">
                    {b.title}
                  </h1>
                  <div className="mt-8 flex flex-wrap items-center gap-5">
                    <Link
                      href={b.link_url || "/catalogo"}
                      onClick={() => logEvent("filter", { metadata: { source: "hero_cta", banner: b.id } })}
                      className="btn btn-solid !bg-cream !text-ink hover:!bg-gold-soft"
                    >
                      {b.cta_text || "Ver coleção completa"}
                    </Link>
                    <Link
                      href="/sobre"
                      className="hidden text-[13px] font-medium text-cream/85 underline-offset-4 hover:text-cream hover:underline sm:inline-block"
                    >
                      Conheça a marca
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Indicadores — traço fino, alvos de toque generosos */}
      <div className="absolute bottom-6 right-5 z-10 flex gap-2 sm:right-8">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Ir para banner ${i + 1}`}
            aria-current={i === idx}
            className="flex h-7 items-center"
          >
            <span
              className={`block h-[2px] w-full rounded-full transition-all duration-500 ${
                i === idx ? "w-10 bg-cream" : "w-5 bg-cream/35"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-bounce text-cream/50 md:block" aria-hidden>
        <Icon name="chevronDown" size={20} />
      </div>
    </section>
  );
}
