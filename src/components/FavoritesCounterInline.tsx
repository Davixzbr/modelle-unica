"use client";

import { useFavorites } from "@/hooks/useFavorites";

/** Badge numérico no coração do header. */
export default function FavoritesCounterInline() {
  const { count, ready } = useFavorites();
  if (!ready || count === 0) return null;
  return (
    <span
      className="absolute -right-2 -top-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-caramel px-1 text-[10px] font-bold text-white"
      aria-hidden
    >
      {count}
    </span>
  );
}
