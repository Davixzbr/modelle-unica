import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";

export type Depoimento = { name: string; text: string; rating: number };

/** Estrelas SVG inline (sem lib). 1–5. */
function Stars({ rating }: { rating: number }) {
  const n = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <span
      className="flex gap-0.5 text-gold"
      role="img"
      aria-label={`${n} de 5 estrelas`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2-5.6-3.2L6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3Z" />
        </svg>
      ))}
    </span>
  );
}

/** Depoimentos vindos de settings.key='depoimentos'. Renderiza só se houver dados. */
export default function Testimonials({ items }: { items: Depoimento[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="border-y border-line bg-sand/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-12 text-center">
          <p className="kicker">Quem veste</p>
          <h2 className="font-display mt-2 text-3xl text-ink sm:text-[42px]">
            O que elas dizem
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {items.slice(0, 8).map((d, i) => (
            <Reveal key={`${d.name}-${i}`} delayMs={i * 60}>
              <figure className="flex h-full flex-col rounded-2xl border border-line bg-cream p-7 shadow-card">
                <Stars rating={d.rating} />
                <blockquote className="mt-4 flex-1 text-[14.5px] leading-relaxed text-ink-soft">
                  “{d.text}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-soft font-display text-[13px] font-semibold text-gold-deep" aria-hidden>
                    {d.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="text-[13.5px] font-medium text-ink">{d.name}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Selos de confiança (rodapé do produto e seção da home). */
export function TrustBadges({ variant = "home" }: { variant?: "home" | "product" }) {
  const items = [
    { icon: "package", t: "Entrega em Palmas" },
    { icon: "check", t: "Troca em até 7 dias" },
    { icon: "whatsapp", t: "Atendimento humano no WhatsApp" },
  ];
  if (variant === "product") {
    return (
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-[12.5px] text-ink-soft">
        {items.map((s) => (
          <span key={s.t} className="flex items-center gap-2">
            <Icon name={s.icon} size={14} className="text-gold-deep" />
            {s.t}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-10 gap-y-3 px-5 py-6 text-[12.5px] text-ink-soft">
      {items.map((s) => (
        <span key={s.t} className="flex items-center gap-2">
          <Icon name={s.icon} size={14} className="text-gold-deep" />
          {s.t}
        </span>
      ))}
    </div>
  );
}
