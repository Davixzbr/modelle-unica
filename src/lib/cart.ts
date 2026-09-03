import { FAVORITES_KEY } from "./format";
export { FAVORITES_KEY };

/** Item do carrinho: variante exata (size+color) com estoque máximo conhecido. */
export type CartItem = {
  key: string; // productId||size||color
  productId: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  price: number; // preço unitário efetivo (promo quando houver)
  qty: number;
  maxStock: number; // estoque real da variante no momento em que foi adicionada
  image?: string | null;
};

export const CART_KEY = "mu_cart_v1";

/** Lê o carrinho do localStorage. Tolera lixo/versões antigas. */
export function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartItem =>
        x &&
        typeof x.key === "string" &&
        typeof x.productId === "string" &&
        typeof x.name === "string" &&
        typeof x.price === "number" &&
        typeof x.qty === "number" &&
        x.qty > 0
    );
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("mu:cart-changed"));
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.qty, 0);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.qty * i.price, 0);
}

/** Monta a chave única de variante. */
export function variantKey(productId: string, size?: string | null, color?: string | null) {
  return [productId, size ?? "", color ?? ""].join("||");
}

/**
 * Mensagem estruturada do pedido p/ WhatsApp — padrão acordado com a loja.
 * Ex.:
 *   Olá! Quero fazer um pedido:
 *   • Top Faithful — G / Preto — 2x R$ 89,90
 *   • Leggin Elegance — M / Verde — 1x R$ 119,90
 *   Total: R$ 299,70
 *   (pode alterar valores/retirar no local?)
 */
export function buildOrderMessage(items: CartItem[]): string {
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const lines = ["Olá! Quero fazer um pedido:"];
  for (const it of items) {
    const parts = [it.name];
    if (it.size) parts.push(it.size);
    if (it.color) parts.push(it.color);
    lines.push(`• ${parts.join(" — ")} — ${it.qty}x ${fmt(it.price)}`);
  }
  lines.push(`Total: ${fmt(cartTotal(items))}`);
  lines.push("(pode alterar valores/retirar no local?)");
  return lines.join("\n");
}
