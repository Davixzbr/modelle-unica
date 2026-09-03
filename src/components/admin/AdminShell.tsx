"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/produtos", label: "Produtos", icon: "◈" },
  { href: "/admin/categorias", label: "Categorias & Coleções", icon: "❏" },
  { href: "/admin/banners", label: "Banners & Home", icon: "▤" },
  { href: "/admin/cliques", label: "Interesses (WhatsApp)", icon: "✆" },
  { href: "/admin/config", label: "Configurações", icon: "⚙" },
];

export default function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div>
      <aside className="a-sidebar">
        <div className="px-5 py-6">
          <p className="text-lg font-semibold text-white">
            Modelle <span style={{ color: "var(--a-accent)" }}>Única</span>
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">Painel administrativo</p>
        </div>
        <nav className="flex-1">
          {NAV.map((n) => {
            const active =
              n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={active ? "active" : ""}>
                <span aria-hidden>{n.icon}</span> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <p className="truncate text-xs text-gray-400">{email}</p>
          <button
            onClick={logout}
            className="mt-2 text-xs text-gray-300 underline-offset-2 hover:text-white hover:underline"
          >
            Sair da conta
          </button>
        </div>
      </aside>
      <div className="a-main">{children}</div>
    </div>
  );
}
