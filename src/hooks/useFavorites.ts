"use client";

import { useCallback, useEffect, useState } from "react";
import { logFavorite } from "@/lib/analytics";
import { readFavorites, writeFavorites } from "@/lib/format";

/** Estado global de favoritos: localStorage + contador no banco. */
export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(readFavorites());
    setReady(true);
    const sync = () => setIds(readFavorites());
    window.addEventListener("mu:favorites-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("mu:favorites-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    const current = readFavorites();
    const adding = !current.includes(id);
    const next = adding ? [...current, id] : current.filter((x) => x !== id);
    writeFavorites(next);
    logFavorite(id, adding ? 1 : -1);
    setIds(next);
    return adding;
  }, []);

  const remove = useCallback((id: string) => {
    const next = readFavorites().filter((x) => x !== id);
    writeFavorites(next);
    logFavorite(id, -1);
    setIds(next);
  }, []);

  return { ids, has, toggle, remove, ready, count: ids.length };
}
