import { NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const config = { runtime: "edge" };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");
  const siteName = searchParams.get("site") || "Modelle Única";
  const size = searchParams.get("tamanho");
  const color = searchParams.get("cor");

  if (!slug && !id) {
    return Response.json({ error: "informe slug ou id" }, { status: 400 });
  }

  let query = `${SUPABASE_URL}/rest/v1/products?select=id,name,slug&limit=1`;
  query += slug ? `&slug=eq.${encodeURIComponent(slug)}` : `&id=eq.${id}`;

  const res = await fetch(query, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  const rows: { id: string; name: string; slug: string }[] = await res.json();

  if (!rows?.length) {
    return Response.json({ error: "produto não encontrado" }, { status: 404 });
  }

  const p = rows[0];
  const parts = [
    `Olá, ${siteName}! Tenho interesse na peça *${p.name}*`,
    size ? `• Tamanho: ${size}` : null,
    color ? `• Cor: ${color}` : null,
  ].filter(Boolean);

  // Log do clique (fire-and-forget)
  const wa_number = await (async () => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=value&key=eq.site`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    });
    const s = await r.json();
    return s?.[0]?.value?.whatsapp || "";
  })();

  const link = `https://wa.me/${wa_number}?text=${encodeURIComponent(parts.join("\n"))}`;

  fetch(`${SUPABASE_URL}/rest/v1/whatsapp_clicks`, {
    method: "POST",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      product_id: p.id,
      product_name: p.name,
      size: size || null,
      color: color || null,
      source_page: "product",
    }),
  }).catch(() => {});

  return Response.redirect(link, 302);
}
