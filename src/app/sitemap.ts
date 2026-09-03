import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase-server";
import { SITE_URL } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const staticPages = ["", "/catalogo", "/sobre", "/contato", "/medidas"].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
  }));

  try {
    const supabase = await createClient();
    // RPC garante somente produtos ativos (RLS-proof, sem depender de embed)
    const { data } = await supabase.rpc("products_with_stock", {
      p_order: "updated_at",
      p_asc: false,
      p_limit: 1000,
      p_slug: null,
    });
    const productPages = ((data as unknown as { slug: string; updated_at: string }[]) || []).map(
      (p) => ({
        url: `${base}/produto/${p.slug}`,
        lastModified: new Date(p.updated_at),
      })
    );
    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
