/**
 * Mapeamento nome de cor → hex para swatches.
 * Fallback neutro p/ qualquer cor sem mapeamento.
 */

const COLOR_MAP: Record<string, string> = {
  preto: "#1c1a17",
  branco: "#faf8f4",
  verde: "#3e5c46",
  "verde militar": "#4a5443",
  "verde oliva": "#6b6f4a",
  vinho: "#6e2639",
  "vinho seco": "#5c2131",
  areia: "#d9c7a7",
  azul: "#31456e",
  "azul marinho": "#23304d",
  "azul claro": "#9db4cd",
  rosa: "#c98a94",
  "rosa claro": "#e3bfc4",
  "rosa antigo": "#c2848a",
  cinza: "#8d8a85",
  "cinza claro": "#bdbab4",
  "cinza escuro": "#4d4a46",
  bege: "#d6c3a5",
  marrom: "#6b4f3a",
  caramelo: "#b3763f",
  terracota: "#b0654a",
  dourado: "#b98a2f",
  prata: "#b9b9b9",
  prateado: "#b9b9b9",
  lilás: "#a58fc0",
  lilas: "#a58fc0",
  roxo: "#5d4a7a",
  vermelho: "#a63a35",
  laranja: "#c06a35",
  amarelo: "#c9a83c",
  offwhite: "#f1ece2",
  "off white": "#f1ece2",
  "off-white": "#f1ece2",
  nude: "#d8b9a6",
  caqui: "#a89570",
  estampado: "#c9b8a3",
  estampa: "#c9b8a3",
  floral: "#c98a94",
  mescla: "#a5a29d",
  jeans: "#4a6284",
};

/** Fallback neutro (tom areia) p/ cor desconhecida. */
export const FALLBACK_COLOR = "#c9b8a3";

/** Normaliza nome: minúsculas, sem acentos, espaços simples. */
export function normalizeColorName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Hex de um nome de cor; fallback neutro se não mapeado. */
export function colorHex(name: string): string {
  const key = normalizeColorName(name);
  if (COLOR_MAP[key]) return COLOR_MAP[key];
  // tenta primeira palavra (ex.: "Verde Militar" → "verde")
  const first = key.split(" ")[0];
  return COLOR_MAP[first] || FALLBACK_COLOR;
}

/** true se a cor é clara o suficiente p/ exigir borda visível no swatch. */
export function isLightColor(name: string): boolean {
  const hex = colorHex(name).replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}
