import { SITE_URL } from "./env";

export type WaProductInfo = {
  siteName: string;
  productName: string;
  size?: string | null;
  color?: string | null;
  price?: number | null;
  slug?: string;
};

/** Formata valor em BRL. */
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

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Mensagem de interesse no WhatsApp — formato profissional. */
export function productWaMessage(p: WaProductInfo): string {
  const lines = [
    `Olá, ${p.siteName}! Tenho interesse no produto *${p.productName}*.`,
  ];
  if (p.color) lines.push(`Cor: ${p.color}`);
  if (p.size) lines.push(`Tamanho: ${p.size}`);
  if (p.price != null) lines.push(`Preço: ${brl(p.price)}`);
  if (p.slug) lines.push(`Link: ${SITE_URL}/produto/${p.slug}`);
  return lines.join("\n");
}

export function waLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Sanitiza número: só dígitos. Garante formato wa.me. */
export function waNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Favoritos no localStorage — fonte única para leitura/escrita. */
export const FAVORITES_KEY = "mu_favorites";

export function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeFavorites(ids: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("mu:favorites-changed"));
}

/** Compartilha com API nativa quando disponível; fallback copia o link. */
export async function shareProduct(
  url: string,
  title: string
): Promise<"shared" | "copied" | "failed"> {
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return "shared";
    }
  } catch {
    /* usuário cancelou ou API falhou → fallback */
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

/** Compressão client-side de imagem antes do upload (max N px, JPEG q%). */
export async function compressImage(
  file: File,
  maxSize = 1600,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1 && file.size < 400_000) return file; // já pequena
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality)
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}
