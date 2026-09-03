"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readCart,
  writeCart,
  cartCount,
  variantKey,
  type CartItem,
} from "@/lib/cart";

/**
 * Estado global do carrinho: localStorage + evento custom `mu:cart-changed`
 * (mesmo padrão de useFavorites). `ready` evita mismatch de hidratação.
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setReady(true);
    const sync = () => setItems(readCart());
    window.addEventListener("mu:cart-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("mu:cart-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /**
   * Adiciona (ou soma à) variante. Nunca passa do estoque real da variante.
   * Retorna o estado final: "added" | "max" (já no limite) | "out" (sem estoque).
   */
  const add = useCallback(
    (
      input: Omit<CartItem, "key" | "qty"> & { qty?: number }
    ): "added" | "max" | "out" => {
      const qty = input.qty ?? 1;
      const current = readCart();
      const key = variantKey(input.productId, input.size, input.color);
      const existing = current.find((i) => i.key === key);
      const max = Math.max(0, input.maxStock ?? 0);
      if (max <= 0) return "out";
      const desired = (existing?.qty ?? 0) + qty;
      if (desired > max) {
        if (existing) {
          existing.qty = max;
          writeCart(current);
        }
        return "max";
      }
      if (existing) existing.qty = desired;
      else
        current.push({
          ...input,
          key,
          qty: desired,
          maxStock: max,
        });
      writeCart(current);
      return "added";
    },
    []
  );

  /** Ajusta quantidade (clampada 1..estoque). remove ao zerar. */
  const setQty = useCallback((key: string, qty: number) => {
    const current = readCart();
    const it = current.find((i) => i.key === key);
    if (!it) return;
    const max = it.maxStock || it.qty;
    const next = Math.min(Math.max(1, Math.floor(qty)), max);
    if (next === it.qty) return;
    it.qty = next;
    writeCart(current);
  }, []);

  const remove = useCallback((key: string) => {
    writeCart(readCart().filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => {
    writeCart([]);
  }, []);

  const has = useCallback(
    (productId: string, size?: string | null, color?: string | null) =>
      items.some((i) => i.key === variantKey(productId, size, color)),
    [items]
  );

  return { items, ready, add, setQty, remove, clear, has, count: cartCount(items) };
}
