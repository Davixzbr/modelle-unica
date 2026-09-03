import Image from "next/image";
import Link from "next/link";
import { brl } from "@/lib/format";
import type { Product } from "@/lib/types";

const TAG_LABEL: Record<string, string> = {
  novo: "Novo",
  promocao: "Promoção",
  exclusivo: "Exclusivo",
};

export function StockBadge({ stock, low }: { stock: number; low: number }) {
  if (stock <= 0)
    return (
      <span className="rounded-full bg-ink/80 px-3 py-1 text-[11px] font-medium tracking-wide text-cream">
        Esgotado
      </span>
    );
  if (stock <= low)
    return (
      <span className="rounded-full bg-caramel px-3 py-1 text-[11px] font-medium tracking-wide text-white">
        Últimas peças
      </span>
    );
  return null;
}

export default function ProductCard({ p, lowStock = 2 }: { p: Product; lowStock?: number }) {
  const total = p.total_stock;
  const hasPromo = p.promo_price != null && p.promo_price < p.price;
  const soldOut = total <= 0;

  return (
    <Link
      href={`/produto/${p.slug}`}
      className={`group block transition-opacity ${soldOut ? "opacity-75" : ""}`}
      aria-label={soldOut ? `${p.name} (esgotado)` : `Ver ${p.name}`}
    >
      <div className="zoom-frame relative aspect-[3/4] w-full bg-sand">
        <Image
          src={p.main_image || p.images[0] || "/images/look-001.jpg"}
          alt={p.name}
          fill
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {p.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-full bg-cream/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink"
            >
              {TAG_LABEL[t] || t}
            </span>
          ))}
          {p.is_new && !p.tags.includes("novo") && (
            <span className="rounded-full bg-cream/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink">
              Novo
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <StockBadge stock={total} low={lowStock} />
        </div>
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream/30">
            <span className="rounded-full bg-ink px-5 py-2 text-[11px] font-semibold uppercase tracking-widest text-cream">
              Esgotado
            </span>
          </div>
        )}
      </div>

      <div className="pt-3">
        <h3 className="font-display text-[15px] leading-snug text-ink transition-colors group-hover:text-caramel">
          {p.name}
        </h3>
        {p.short_description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">{p.short_description}</p>
        )}
        <p className="mt-1 flex items-baseline gap-2">
          {hasPromo ? (
            <>
              <span className="text-sm font-semibold text-caramel">{brl(p.promo_price!)}</span>
              <span className="text-xs text-ink-soft line-through">{brl(p.price)}</span>
            </>
          ) : (
            <span className="text-sm font-semibold text-ink">{brl(p.price)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
