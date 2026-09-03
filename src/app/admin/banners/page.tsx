import { createClient } from "@/lib/supabase-server";
import BannersClient from "./BannersClient";
import type { Banner, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const supabase = await createClient();
  const [{ data: banners }, { data: featured }] = await Promise.all([
    supabase.from("banners").select("*").order("sort_order"),
    supabase
      .from("products")
      .select("*")
      .neq("status", "draft")
      .order("sort_order")
      .limit(30),
  ]);

  return (
    <BannersClient
      initialBanners={(banners as Banner[]) || []}
      featured={(featured as Product[]) || []}
    />
  );
}
