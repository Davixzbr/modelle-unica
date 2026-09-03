import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: lastEvent } = await supabase
    .from("events")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1);

  return (
    <AccountClient
      email={user.email || ""}
      createdAt={user.created_at || null}
      lastEventAt={lastEvent?.[0]?.created_at || null}
    />
  );
}
