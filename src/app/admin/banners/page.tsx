import { createClient } from "@/lib/supabase-server";
import BannersClient from "./BannersClient";
import type { Banner } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const supabase = await createClient();
  const { data: banners } = await supabase.from("banners").select("*").order("sort_order");

  return <BannersClient initialBanners={(banners as Banner[]) || []} />;
}
