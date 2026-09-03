import { createClient } from "@/lib/supabase-server";

export type SiteConfig = {
  name: string;
  tagline: string;
  whatsapp: string;
  whatsappDisplay: string;
  instagram: string;
  instagramHandle: string;
  address: string;
  email: string;
  hours: string;
  low_stock: number;
};

const FALLBACK: SiteConfig = {
  name: "Modelle Única",
  tagline: "Esteja sempre em movimento.",
  whatsapp: "556392678729",
  whatsappDisplay: "+55 63 9267-8729",
  instagram: "https://www.instagram.com/modelle_unica/",
  instagramHandle: "@modelle_unica",
  address: "",
  email: "",
  hours: "",
  low_stock: 2,
};

/** Lê as configurações do site do banco (com fallback). Cache curto por request. */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "site")
      .single();
    return { ...FALLBACK, ...(data?.value || {}) };
  } catch {
    return FALLBACK;
  }
}

export async function getSetting(key: string): Promise<Record<string, unknown> | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", key)
      .single();
    return data?.value ?? null;
  } catch {
    return null;
  }
}
