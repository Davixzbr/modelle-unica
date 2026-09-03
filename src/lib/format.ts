export function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function waLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function productWaMessage(
  siteName: string,
  productName: string,
  size?: string | null,
  color?: string | null,
  url?: string
): string {
  const parts = [
    `Olá, ${siteName}! Tenho interesse na peça *${productName}*`,
    size ? `• Tamanho: ${size}` : null,
    color ? `• Cor: ${color}` : null,
    url ? `• Link: ${url}` : null,
  ].filter(Boolean);
  return parts.join("\n");
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
