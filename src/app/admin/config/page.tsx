import { createClient } from "@/lib/supabase-server";
import SettingsClient from "./SettingsClient";
import { getSiteConfig } from "@/lib/site-config";
import type { Depoimento } from "@/components/Testimonials";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const site = await getSiteConfig();

  const [{ data: about }, { data: policy }, { data: deps }] = await Promise.all([
    supabase.from("settings").select("value").eq("key", "about").maybeSingle(),
    supabase.from("settings").select("value").eq("key", "exchange_policy").maybeSingle(),
    supabase.from("settings").select("value").eq("key", "depoimentos").maybeSingle(),
  ]);

  const depoimentos = (deps?.value as unknown as Depoimento[]) || [];

  return (
    <SettingsClient
      site={site}
      about={about?.value ?? null}
      policy={policy?.value ?? null}
      depoimentos={depoimentos}
    />
  );
}
