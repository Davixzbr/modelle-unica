"use client";

import { useFavorites } from "@/hooks/useFavorites";

/** Contador ao lado de "Favoritos" no header. */
export default function FavoritesCounter() {
  const { count, ready } = useFavorites();
  if (!ready || count === 0) return null;
  return (
    <span
      className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-caramel px-2 text-sm font-semibold text-white"
      aria-label={`${count} favorito(s)`}
    >
      {count}
    </span>
  );
}
