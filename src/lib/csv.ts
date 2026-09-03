/**
 * Export CSV client-side — BOM UTF-8 (Excel PT-BR), separador ";", decimal ",".
 */

/** Escapa célula: aspas duplas duplicadas; envolve com aspas se tiver ; " \n. */
function cell(v: unknown): string {
  let s: string;
  if (v == null) s = "";
  else if (typeof v === "number") s = String(v).replace(".", ",");
  else s = String(v);
  if (/[;\r\n"]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Gera CSV (com BOM) a partir de cabeçalho + linhas de valores. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(cell).join(";"));
  return "\uFEFF" + lines.join("\r\n");
}

/** Baixa o CSV como arquivo. */
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const blob = new Blob([toCsv(headers, rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
