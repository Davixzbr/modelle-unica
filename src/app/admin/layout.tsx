import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import AdminShell from "@/components/admin/AdminShell";
import "./admin.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Login é página própria fora do shell
  if (!user) {
    return <div className="admin-root">{children}</div>;
  }

  return (
    <div className="admin-root">
      <AdminShell email={user.email || ""}>{children}</AdminShell>
    </div>
  );
}
