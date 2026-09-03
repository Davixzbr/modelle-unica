"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { buildOrderMessage, cartTotal, type CartItem } from "@/lib/cart";
import { brl, waLink, waNumber } from "@/lib/format";
import { logEvent } from "@/lib/analytics";
import { useCart } from "@/hooks/useCart";
import Icon from "@/components/Icon";
import { EmptyState } from "@/components/States";
import { toast } from "@/components/Toast";

type Props = { siteName: string; whatsapp: string };

export default function CartClient({ siteName, whatsapp }: Props) {
  const { items, ready, setQty, remove, clear } = useCart();
  const [sending, setSending] = useState(false);

  // Preço unitário atual (promo mudou desde que adicionou? usa o novo)
  const priceOf = useMemo(() => {
    const map = new Map<string, number>();
    return {
      prime: async (ids: string[]) => {
        if (!ids.length) return;
        try {
          const { data } = await createClient().rpc("products_with_stock", {
            p_order: "sort_order",
            p_asc: true,
            p_limit: 500,
            p_slug: null,
          });
          for (const p of (data as unknown as Array<{
            id: string;
            price: number;
            promo_price: number | null;
            status: string;
          }>) || []) {
            map.set(p.id, p.promo_price != null && p.promo_price < p.price ? p.promo_price : p.price);
          }
        } catch {
          /* mantém preços do carrinho */
        }
      },
      get: (it: CartItem) => map.get(it.productId) ?? it.price,
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    priceOf.prime([...new Set(items.map((i) => i.productId))]);
  }, [ready, items, priceOf]);

  const total = useMemo(
    () => items.reduce((s, i) => s + i.qty * priceOf.get(i), 0),
    [items, priceOf]
  );

  async function finish() {
    if (!items.length || sending) return;
    setSending(true);
    try {
      const finalItems = items.map((i) => ({ ...i, price: priceOf.get(i) }));
      const msg = buildOrderMessage(finalItems);
      logEvent("wa_order", {
        metadata: {
          total,
          items: finalItems.map((i) => ({
            product_id: i.productId,
            name: i.name,
            size: i.size,
            color: i.color,
            qty: i.qty,
            price: i.price,
          })),
        },
      });
      window.open(waLink(waNumber(whatsapp), msg), "_blank", "noopener");
      toast("Pedido enviado no WhatsApp! Respondemos rapidinho.");
      clear();
    } finally {
      setSending(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <div className="h-40 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        title="Seu carrinho está vazio"
        hint="Escolha suas peças no catálogo — tamanho e cor ficam guardados aqui."
        action={
          <Link href="/catalogo" className="btn btn-solid">
            Ver catálogo
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:pt-14">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="kicker">Seu pedido</p>
          <h1 className="font-display mt-2 text-4xl text-ink sm:text-5xl">Carrinho</h1>
        </div>
        <button
          onClick={clear}
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-faint transition-colors hover:text-wine"
          aria-label="Esvaziar carrinho"
        >
          <Icon name="trash" size={14} /> Esvaziar
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Itens */}
        <ul className="grid gap-4" aria-label="Itens do carrinho">
          {items.map((it) => {
            const price = priceOf.get(it);
            const max = it.maxStock || it.qty;
            return (
              <li
                key={it.key}
                className="flex gap-4 rounded-2xl border border-line bg-paper p-3.5 sm:gap-5 sm:p-4"
              >
                <Link
                  href={`/produto/${it.slug}`}
                  className="relative aspect-[3/4] w-20 flex-none overflow-hidden rounded-xl bg-sand sm:w-24"
                  aria-label={`Ver ${it.name}`}
                >
                  <Image
                    src={it.image || "/images/look-001.jpg"}
                    alt={it.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/produto/${it.slug}`}
                        className="font-display block truncate text-[16px] text-ink hover:text-gold-deep"
                      >
                        {it.name}
                      </Link>
                      <p className="mt-0.5 text-[12.5px] text-ink-faint">
                        {[it.size, it.color].filter(Boolean).join(" · ") || "peça única"}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(it.key)}
                      aria-label={`Remover ${it.name} do carrinho`}
                      className="grid h-8 w-8 flex-none place-items-center rounded-full text-ink-faint transition-colors hover:bg-sand hover:text-wine"
                    >
                      <Icon name="x" size={15} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-line">
                      <button
                        onClick={() => setQty(it.key, it.qty - 1)}
                        disabled={it.qty <= 1}
                        aria-label={`Diminuir quantidade de ${it.name}`}
                        className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-sand disabled:opacity-30"
                      >
                        <Icon name="chevronLeft" size={14} />
                      </button>
                      <span className="w-7 text-center text-[14px] font-semibold tabular-nums" aria-live="polite">
                        {it.qty}
                      </span>
                      <button
                        onClick={() => setQty(it.key, it.qty + 1)}
                        disabled={it.qty >= max}
                        aria-label={`Aumentar quantidade de ${it.name}`}
                        className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-sand disabled:opacity-30"
                      >
                        <Icon name="chevronRight" size={14} />
                      </button>
                    </div>
                    <p className="text-[15px] font-semibold text-ink tabular-nums">
                      {brl(price * it.qty)}
                      {it.qty > 1 && (
                        <span className="ml-1.5 text-[12px] font-normal text-ink-faint">
                          ({it.qty}x {brl(price)})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Resumo */}
        <aside className="h-fit rounded-2xl border border-line bg-paper p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl text-ink">Resumo</h2>
          <dl className="mt-5 grid gap-2.5 text-[14px]">
            <div className="flex justify-between text-ink-soft">
              <dt>Peças</dt>
              <dd className="tabular-nums">
                {items.reduce((s, i) => s + i.qty, 0)}
              </dd>
            </div>
            <div className="my-1 h-px bg-line" />
            <div className="flex justify-between text-[16px] font-semibold text-ink">
              <dt>Total</dt>
              <dd className="tabular-nums">{brl(total)}</dd>
            </div>
            <p className="text-[12.5px] text-ink-faint">
              ou 3x de {brl(total / 3)} sem juros
            </p>
          </dl>
          <button
            onClick={finish}
            disabled={sending}
            className="btn btn-solid mt-6 min-h-13 w-full !text-[13.5px] disabled:opacity-50"
          >
            <Icon name="whatsapp" size={17} />
            Finalizar no WhatsApp
          </button>
          <p className="mt-3 text-center text-[12.5px] text-ink-faint">
            Você será atendida pela {siteName} — pode ajustar tudo na conversa.
          </p>
          <Link
            href="/catalogo"
            className="mt-4 block text-center text-[13px] text-gold-deep underline-offset-2 hover:underline"
          >
            Continuar comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
