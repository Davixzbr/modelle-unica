"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import Icon from "@/components/Icon";

const GROUPS: { title: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    title: "Principal",
    items: [{ href: "/admin", label: "Dashboard", icon: "dashboard" }],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/produtos", label: "Produtos", icon: "package" },
      { href: "/admin/categorias", label: "Categorias", icon: "folder" },
      { href: "/admin/colecoes", label: "Coleções", icon: "tag" },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { href: "/admin/banners", label: "Banners", icon: "image" },
      { href: "/admin/destaques", label: "Destaques da Home", icon: "star" },
    ],
  },
  {
    title: "Relacionamento",
    items: [
      { href: "/admin/cliques", label: "Interesses", icon: "message" },
      { href: "/admin/analytics", label: "Analytics", icon: "chart" },
    ],
  },
  {
    title: "Configurações",
    items: [
      { href: "/admin/config", label: "Loja", icon: "settings" },
      { href: "/admin/conta", label: "Conta", icon: "user" },
    ],
  },
];

const TITLES: Record<string, { section: string; title: string }> = {
  "/admin": { section: "Principal", title: "Visão geral" },
  "/admin/produtos": { section: "Catálogo", title: "Produtos" },
  "/admin/produtos/novo": { section: "Catálogo", title: "Novo produto" },
  "/admin/categorias": { section: "Catálogo", title: "Categorias" },
  "/admin/colecoes": { section: "Catálogo", title: "Coleções" },
  "/admin/banners": { section: "Conteúdo", title: "Banners" },
  "/admin/destaques": { section: "Conteúdo", title: "Destaques da Home" },
  "/admin/cliques": { section: "Relacionamento", title: "Interesses" },
  "/admin/analytics": { section: "Relacionamento", title: "Analytics" },
  "/admin/config": { section: "Configurações", title: "Loja" },
  "/admin/conta": { section: "Configurações", title: "Conta" },
};

export default function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);

  // Meta contextual: /admin/produtos/<id> → "Editar produto"
  let meta = TITLES[pathname];
  if (!meta && /^\/admin\/produtos\/[^/]+$/.test(pathname)) {
    meta = { section: "Catálogo", title: "Editar produto" };
  }
  if (!meta) meta = { section: "Painel", title: "Modelle Única" };

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  async function logout() {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const nav = (
    <>
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="a-navgroup">{g.title}</p>
          {g.items.map((n) => {
            const active =
              n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={active ? "active" : ""}>
                <Icon name={n.icon} size={17} />
                {n.label}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );

  return (
    <div className="admin-frame">
      <aside className="a-sidebar">
        <Link href="/admin" className="a-brand">
          <span className="name">
            Modelle <em>Única</em>
          </span>
          <span className="sub">Painel administrativo</span>
        </Link>
        <nav className="flex-1 pb-4">{nav}</nav>
        <div className="a-sidefoot">
          <p className="who">{email}</p>
          <button
            onClick={logout}
            className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--a-muted)] hover:text-[color:var(--a-text)]"
          >
            <Icon name="logout" size={14} /> Sair da conta
          </button>
        </div>
      </aside>

      {drawer && (
        <>
          <div className="a-drawerbg" onClick={() => setDrawer(false)} />
          <aside className="a-drawer">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--a-border-soft)]">
              <span className="a-brand !p-0 !border-0">
                <span className="name">
                  Modelle <em>Única</em>
                </span>
              </span>
              <button className="a-iconbtn" onClick={() => setDrawer(false)} aria-label="Fechar menu">
                <Icon name="x" size={18} />
              </button>
            </div>
            <nav className="pb-6">{nav}</nav>
            <div className="a-sidefoot">
              <p className="who">{email}</p>
              <button
                onClick={logout}
                className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--a-muted)]"
              >
                <Icon name="logout" size={14} /> Sair
              </button>
            </div>
          </aside>
        </>
      )}

      <div className="flex-1 min-w-0">
        <header className="a-topbar">
          <button
            className="a-iconbtn lg:hidden"
            onClick={() => setDrawer(true)}
            aria-label="Abrir menu"
          >
            <Icon name="menu" size={20} />
          </button>
          <nav className="crumb" aria-label="Localização">
            <span>{meta.section}</span>
            <Icon name="chevronRight" size={12} />
            <b>{meta.title}</b>
          </nav>
          <div className="spacer" />
          <Link href="/" target="_blank" className="a-iconbtn" title="Ver loja">
            <Icon name="external" size={17} />
          </Link>
          <Link href="/admin/conta" className="a-iconbtn" title="Conta">
            <Icon name="user" size={17} />
          </Link>
        </header>
        <main className="a-main">{children}</main>
      </div>
    </div>
  );
}
