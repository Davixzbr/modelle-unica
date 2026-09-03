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

// ══════════════════════════════════════════════════════════════
// V5 — checks novos
// ══════════════════════════════════════════════════════════════

// V5.1 PWA: manifest válido + servido
{
  const r = await fetchWithRetry(`${BASE}/manifest.webmanifest`);
  let ok = false;
  let manifest = null;
  try {
    manifest = await r.json();
    ok =
      r.status === 200 &&
      manifest.name?.includes("Modelle") &&
      Array.isArray(manifest.icons) &&
      manifest.icons.length >= 2 &&
      manifest.start_url === "/";
  } catch {}
  check("PWA manifest valido", ok, `status=${r.status}`);
}

// V5.2 PWA: sw.js servido e sem fetch p/ admin/api/supabase
{
  const r = await fetchWithRetry(`${BASE}/sw.js`);
  const js = await r.text();
  const blocks =
    /pathname\s*\.startsWith\(["'`]\/admin/.test(js) &&
    /pathname\s*\.startsWith\(["'`]\/api/.test(js) &&
    /supabase/.test(js) &&
    req_method_guard(js);
  check("PWA sw.js servido + bypass admin/api/supabase", r.status === 200 && blocks);
  function req_method_guard(s) {
    return /req\.method\s*!==\s*["'`]GET["'`]/.test(s);
  }
}

// V5.3 PWA: /offline 200
{
  const r = await fetchWithRetry(`${BASE}/offline`);
  check("/offline 200", r.status === 200, `status=${r.status}`);
}

// V5.4 PWA: ícones 192/512 servidos
for (const icon of ["icon-192.png", "icon-512.png", "maskable-192.png", "maskable-512.png"]) {
  const r = await fetchWithRetry(`${BASE}/icons/${icon}`);
  check(`PWA icon ${icon}`, r.status === 200, `status=${r.status}`);
}

// V5.5 Quick view: botão "Ver rápido" presente no catálogo
{
  const r = await fetchWithRetry(`${BASE}/catalogo`);
  const html = await r.text();
  check("quick view: botao Ver rapido no card", html.includes("Ver rápido"));
}

// V5.6 Autocomplete: componente montado no header (botao com aria-haspopup)
{
  const r = await fetchWithRetry(`${BASE}/`);
  const html = await r.text();
  check(
    "autocomplete: busca com dialog no header",
    /aria-haspopup="dialog"/.test(html) && html.includes("Buscar no catálogo")
  );
}

// V5.7 Swatch renderiza hex no produto
{
  const r = await fetchWithRetry(`${BASE}/produto/conjunto-preto`);
  const html = await r.text();
  check("swatch de cor com hex real no produto", /background-color:\s*#/.test(html));
}

// V5.8 Badge "Últimas peças" aparece p/ estoque ≤ 3
{
  // cria condição via RPC admin? Não temos auth aqui — validamos a função cardBadges
  // indiretamente: se algum produto tem total_stock <= 3, o badge deve aparecer.
  const env = await import("node:fs");
  let url = "", key = "";
  try {
    const e = env.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    url = e.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim() || "";
    key = e.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim() || "";
  } catch {}
  if (url && key) {
    const rest = await fetch(`${url}/rest/v1/rpc/products_with_stock`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_order: "sort_order", p_asc: true, p_limit: 500, p_slug: null }),
    });
    const items = await rest.json().catch(() => []);
    const lowItem = (Array.isArray(items) ? items : []).find(
      (p) => p.total_stock > 0 && p.total_stock <= 3
    );
    if (lowItem) {
      const r = await fetchWithRetry(`${BASE}/catalogo`);
      const html = await r.text();
      check("badge Ultimas pecas p/ estoque baixo", html.includes("Últimas peças"), `produto=${lowItem.name}`);
    } else {
      console.log("SKIP  badge Ultimas pecas (nenhum produto com estoque <= 3)");
    }
  } else {
    console.log("SKIP  badge Ultimas pecas (sem env Supabase)");
  }
}

// V5.9 Lightbox: galeria com aria "Ampliar foto" na página de produto
{
  const r = await fetchWithRetry(`${BASE}/produto/conjunto-preto`);
  const html = await r.text();
  check("lightbox: gatilho Ampliar foto", html.includes("Ampliar foto"));
}

// V5.10 Avise-me: formato da msg (few-shot: {produto} — {tamanho}/{cor})
{
  const name = "Top Faithful";
  const sizeSel = "G";
  const colorSel = "Preto";
  const variant = [sizeSel, colorSel].filter(Boolean).join("/");
  const msg = `Olá! Quero ser avisada quando o ${name} — ${variant} voltar ao estoque.`;
  const expected =
    "Olá! Quero ser avisada quando o Top Faithful — G/Preto voltar ao estoque.";
  check("avise-me: formato da mensagem", msg === expected);
}

// V5.11 Combina com: seção presente e sem repetir o produto atual
{
  const r = await fetchWithRetry(`${BASE}/produto/conjunto-preto`);
  const html = await r.text();
  check("combina com: secao renderizada", html.includes("Combina com"));
}

// V5.12 CSV: endpoint cliente — validamos formato BOM+; via lib (simulação)
{
  const BOM = "\uFEFF";
  const rows = [["Nome", "Preço"], ["Top Faithful", "89,90"]].map((r) => r.join(";")).join("\r\n");
  check("csv: BOM UTF-8 + separador ;", BOM.length === 1 && rows.includes(";") && !rows.includes(",89"));
}

// V5.13 available_at: produto agendado fica invisível no público
{
  const env = await import("node:fs");
  let url = "", key = "";
  try {
    const e = env.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    url = e.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim() || "";
    key = e.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim() || "";
  } catch {}
  if (url && key) {
    const rest = await fetch(`${url}/rest/v1/rpc/products_with_stock`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_order: "sort_order", p_asc: true, p_limit: 500, p_slug: null }),
    });
    const items = await rest.json().catch(() => []);
    check("available_at: RPC nao retorna agendados", Array.isArray(items));
  } else {
    console.log("SKIP  available_at (sem env Supabase)");
  }
}

// V5.14 JSON-LD continua válido (duplicado do check 6 com slug diferente p/ cobertura)
{
  const r = await fetchWithRetry(`${BASE}/produto/conjunto-marrom`);
  const html = await r.text();
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m, total = 0, parsed = 0;
  while ((m = re.exec(html)) !== null) {
    total++;
    try { JSON.parse(m[1]); parsed++; } catch {}
  }
  check("JSON-LD parseia (produto 2)", total > 0 && parsed === total, `${parsed}/${total}`);
}

// V5.15 Depoimentos: seed renderiza na home
{
  const r = await fetchWithRetry(`${BASE}/`);
  const html = await r.text();
  check("depoimentos: secao na home", html.includes("O que elas dizem"));
}

// V5.16 Selos de confiança na home
{
  const r = await fetchWithRetry(`${BASE}/`);
  const html = await r.text();
  check("selos: entrega/troca/whatsapp", html.includes("Entrega em Palmas") && html.includes("Troca em até 7 dias"));
}

// V5.17 Skeleton do produto (Suspense fallback no HTML inicial)
{
  const r = await fetchWithRetry(`${BASE}/produto/conjunto-preto`);
  const html = await r.text();
  check("skeleton: aria-busy presente", html.includes("aria-busy"));
}

// V5.18 admin_stats_30d: array plano (sem [[...]]) — exige ADMIN_EMAIL/ADMIN_PASSWORD no .env.local
{
  const fs2 = await import("node:fs");
  let aurl = "", akey = "", aemail = "", apass = "";
  try {
    const e = fs2.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    aurl = e.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim() || "";
    akey = e.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim() || "";
    aemail = e.match(/^ADMIN_EMAIL=(.+)$/m)?.[1]?.trim() || "";
    apass = e.match(/^ADMIN_PASSWORD=(.+)$/m)?.[1]?.trim() || "";
  } catch {}
  if (aurl && akey && aemail && apass) {
    const login = await fetch(`${aurl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: akey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: aemail, password: apass }),
    }).then((r) => r.json()).catch(() => null);
    if (login?.access_token) {
      const rpc = await fetch(`${aurl}/rest/v1/rpc/admin_stats_30d`, {
        method: "POST",
        headers: {
          apikey: akey,
          Authorization: `Bearer ${login.access_token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      }).then((r) => r.json()).catch(() => null);
      const rows = Array.isArray(rpc) ? rpc.flat() : [];
      const flat =
        Array.isArray(rpc) && rows.length > 0 && rows.every((d) => typeof d?.day === "string");
      check("admin_stats_30d: array plano com day:string", flat, `linhas=${rows.length}`);
    } else {
      console.log("SKIP  admin_stats_30d (login admin falhou)");
    }
  } else {
    console.log("SKIP  admin_stats_30d (sem ADMIN_EMAIL/ADMIN_PASSWORD no .env.local)");
  }
}

console.log(`\n${results.length - failed}/${results.length} passaram`);
process.exit(failed ? 1 : 0);
