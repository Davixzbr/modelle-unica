"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <section
      className="relative h-[72vh] min-h-[480px] w-full overflow-hidden bg-ink sm:h-[78vh] sm:min-h-[520px]"
      aria-roledescription="carrossel"
      aria-label="Banners em destaque"
    >
      {banners.map((b, i) => {
        const src = isMobile && b.image_mobile_url ? b.image_mobile_url : b.image_url;
        return (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
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
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-16 sm:pb-20">
              <div className="max-w-xl">
                {b.subtitle && (
                  <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-cream/70">
                    {b.subtitle}
                  </p>
                )}
                <h1 className="font-display text-3xl leading-tight text-cream sm:text-5xl md:text-6xl">
                  {b.title}
                </h1>
                <div className="mt-7 flex flex-wrap gap-4">
                  <Link
                    href={b.link_url || "/catalogo"}
                    onClick={() => logEvent("filter", { metadata: { source: "hero_cta", banner: b.id } })}
                    className="rounded-full bg-cream px-8 py-3.5 text-[12px] font-semibold uppercase tracking-widest text-ink transition-all hover:bg-caramel hover:text-white"
                  >
                    {b.cta_text || "Ver coleção completa"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Dots — alvos de toque generosos no mobile */}
      <div className="absolute bottom-5 right-5 z-10 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Ir para banner ${i + 1}`}
            aria-current={i === idx}
            className={`h-6 flex items-center ${i === idx ? "w-9" : "w-5"}`}
          >
            <span
              className={`block h-1.5 w-full rounded-full transition-all duration-500 ${
                i === idx ? "bg-cream" : "bg-cream/40"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
