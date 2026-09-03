#!/usr/bin/env node
/**
 * Smoke tests — Modelle Única V4
 * Uso: node scripts/smoke.mjs [baseURL]
 * Sobe um dev/start server antes (ex.: npm run dev) e roda este script.
 */
import { setTimeout as sleep } from "node:timers/promises";

const BASE = process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000";
const results = [];
let failed = 0;

function check(name, ok, extra = "") {
  results.push({ name, ok, extra });
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
}

async function fetchWithRetry(url, opts = {}, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url, opts);
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1500);
    }
  }
}

/** Espera o server responder (dev server compila sob demanda). */
async function waitServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(BASE);
      if (r.status < 500) return true;
    } catch {}
    await sleep(2000);
  }
  return false;
}

// ---- Env p/ teste REST (opcional; usa .env.local se existir)
let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
if (!SUPABASE_URL) {
  try {
    const fs = await import("node:fs");
    const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    SUPABASE_URL = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim() || "";
    SUPABASE_ANON_KEY =
      env.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim() || "";
  } catch {}
}

const ok = await waitServer();
check("server responde", ok);
if (!ok) process.exit(1);

// 1. Home 200
{
  const r = await fetchWithRetry(`${BASE}/`);
  check("home 200", r.status === 200, `status=${r.status}`);
}

// 2. Catálogo 200 com cada param de filtro (compatibilidade retroativa)
const catalogParams = [
  "",
  "?cat=conjuntos",
  "?colecao=x",
  "?tam=P",
  "?cor=preto",
  "?max=200",
  "?disp=1",
  "?tag=promocao",
  "?ord=price_asc",
  "?ord=price_desc",
  "?ord=views",
  "?q=top",
  "?cat=x&ord=price_asc", // combinação legada
];
for (const p of catalogParams) {
  const r = await fetchWithRetry(`${BASE}/catalogo${p}`);
  check(`catalogo 200 ${p || "(sem filtros)"}`, r.status === 200, `status=${r.status}`);
}

// 3. Produto válido 200 / inválido 404
{
  const r = await fetchWithRetry(`${BASE}/produto/conjunto-preto`);
  check("produto valido 200", r.status === 200, `status=${r.status}`);
  const r404 = await fetchWithRetry(`${BASE}/produto/nao-existe-xyz-123`);
  check("produto invalido 404", r404.status === 404, `status=${r404.status}`);
}

// 4. /admin redireciona p/ login sem sessão
{
  const r = await fetchWithRetry(`${BASE}/admin`, { redirect: "manual" });
  const loc = r.headers.get("location") || "";
  check(
    "admin redireciona sem sessao",
    r.status >= 300 && r.status < 400 && loc.includes("/admin/login"),
    `status=${r.status} loc=${loc}`
  );
}

// 5. RPC products_with_stock retorna array via REST
{
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/products_with_stock`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_order: "sort_order", p_asc: true, p_limit: 5, p_slug: null }),
    });
    const data = await r.json().catch(() => null);
    check(
      "RPC products_with_stock via REST",
      r.ok && Array.isArray(data) && data.length > 0,
      `status=${r.status} itens=${Array.isArray(data) ? data.length : "?"}`
    );
  } else {
    console.log("SKIP  RPC products_with_stock (sem env do Supabase)");
  }
}

// 6. JSON-LD parseia na página de produto
{
  const r = await fetchWithRetry(`${BASE}/produto/conjunto-preto`);
  const html = await r.text();
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m,
    parsed = 0,
    total = 0,
    hasProduct = false;
  while ((m = re.exec(html)) !== null) {
    total++;
    try {
      const obj = JSON.parse(m[1]);
      parsed++;
      if (obj["@type"] === "Product" && obj.offers?.price != null && obj.offers?.availability)
        hasProduct = true;
    } catch {}
  }
  check("JSON-LD parseia (produto)", total > 0 && parsed === total, `${parsed}/${total} validos`);
  check("JSON-LD Product c/ price+availability", hasProduct);
}

// 7. Sitemap contém produtos
{
  const r = await fetchWithRetry(`${BASE}/sitemap.xml`);
  const xml = await r.text();
  check("sitemap 200 c/ produtos", r.status === 200 && xml.includes("/produto/"), `status=${r.status}`);
}

// 8. Páginas estáticas do site
for (const p of ["/carrinho", "/favoritos", "/sobre", "/contato", "/medidas"]) {
  const r = await fetchWithRetry(`${BASE}${p}`);
  check(`${p} 200`, r.status === 200, `status=${r.status}`);
}

console.log(`\n${results.length - failed}/${results.length} passaram`);
process.exit(failed ? 1 : 0);
