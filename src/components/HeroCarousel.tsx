"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Banner } from "@/lib/types";

export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5500);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden bg-ink">
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== idx}
        >
          <Image
            src={b.image_url}
            alt={b.title || "Banner"}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-20">
            <div className="max-w-xl">
              {b.subtitle && (
                <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-cream/70">
                  {b.subtitle}
                </p>
              )}
              <h1 className="font-display text-4xl leading-tight text-cream sm:text-5xl md:text-6xl">
                {b.title}
              </h1>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={b.link_url || "/catalogo"}
                  className="rounded-full bg-cream px-8 py-3.5 text-[12px] font-semibold uppercase tracking-widest text-ink transition-all hover:bg-caramel hover:text-white"
                >
                  Ver coleção completa
                </Link>
                <Link
                  href="/sobre"
                  className="rounded-full border border-cream/40 px-8 py-3.5 text-[12px] font-semibold uppercase tracking-widest text-cream transition-all hover:border-cream hover:bg-cream/10"
                >
                  Nossa história
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-6 right-6 z-10 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Banner ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === idx ? "w-8 bg-cream" : "w-3 bg-cream/40 hover:bg-cream/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
