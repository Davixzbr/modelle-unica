import { createClient } from "@/lib/supabase-server";
import AnalyticsClient from "./AnalyticsClient";
import type { ShopEvent, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const [evRes, prodRes] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .gte("created_at", new Date(Date.now() - 90 * 864e5).toISOString()),
    supabase.from("products").select("id, name, slug"),
  ]);

  return (
    <AnalyticsClient
      events={(evRes.data as unknown as ShopEvent[]) || []}
      products={(prodRes.data as unknown as Pick<Product, "id" | "name" | "slug">[]) || []}
    />
  );
}
