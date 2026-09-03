import { createClient } from "@/lib/supabase-server";
import ClicksClient from "./ClicksClient";
import type { ClickLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminClicksPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("whatsapp_clicks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return <ClicksClient initial={(data as ClickLog[]) || []} />;
}
