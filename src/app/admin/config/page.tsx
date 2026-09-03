import { createClient } from "@/lib/supabase-server";
import SettingsClient from "./SettingsClient";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const site = await getSiteConfig();

  const [{ data: about }, { data: policy }] = await Promise.all([
    supabase.from("settings").select("value").eq("key", "about").maybeSingle(),
    supabase.from("settings").select("value").eq("key", "exchange_policy").maybeSingle(),
  ]);

  return (
    <SettingsClient
      site={site}
      about={about?.value ?? null}
      policy={policy?.value ?? null}
    />
  );
}
