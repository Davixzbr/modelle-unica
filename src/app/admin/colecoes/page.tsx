import { createClient } from "@/lib/supabase-server";
import CollectionsClient from "./CollectionsClient";
import type { Collection } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("collections_admin")
    .select("*")
    .order("featured", { ascending: false })
    .order("name");
  return <CollectionsClient initial={(data as unknown as Collection[]) || []} />;
}
