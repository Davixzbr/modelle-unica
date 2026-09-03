"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";

/** Badge numérico no ícone de carrinho do header. */
export default function CartCounterInline() {
  const { count, ready } = useCart();
  if (!ready || count === 0) return null;
  return (
    <span
      className="absolute -right-2 -top-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-wine px-1 text-[10px] font-bold text-white"
      aria-hidden
    >
      {count}
    </span>
  );
}

export function CartHeaderLink() {
  return (
    <Link
      href="/carrinho"
      aria-label="Carrinho"
      className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-sand"
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
        <path d="M2 3h2.5l2.2 12.2a1.5 1.5 0 0 0 1.5 1.3h9.6a1.5 1.5 0 0 0 1.5-1.2L21 7H5.1" />
      </svg>
      <CartCounterInline />
    </Link>
  );
}
