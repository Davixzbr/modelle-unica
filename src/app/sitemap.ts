import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase-server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://modelleunica.com.br";
  const staticPages = ["", "/catalogo", "/sobre", "/contato", "/medidas"].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
  }));

  try {
    const supabase = await createClient();
    const { data } = await supabase.from("products").select("slug, updated_at");
    const productPages = (data || []).map((p) => ({
      url: `${base}/produto/${p.slug}`,
      lastModified: new Date(p.updated_at),
    }));
    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
