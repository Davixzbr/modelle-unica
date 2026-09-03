import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export default async function Header() {
  const supabase = await createClient();
  const { data: cats } = await supabase
    .from("categories")
    .select("name, slug")
    .order("sort_order");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl tracking-wide text-ink">
          Modelle <span className="italic text-caramel">Única</span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] uppercase tracking-widest text-ink-soft md:flex">
          <Link href="/catalogo" className="transition-colors hover:text-caramel">
            Catálogo
          </Link>
          {cats?.slice(0, 3).map((c: { name: string; slug: string }) => (
            <Link
              key={c.slug}
              href={`/catalogo?cat=${c.slug}`}
              className="transition-colors hover:text-caramel"
            >
              {c.name}
            </Link>
          ))}
          <Link href="/sobre" className="transition-colors hover:text-caramel">
            Sobre
          </Link>
          <Link href="/contato" className="transition-colors hover:text-caramel">
            Contato
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/favoritos"
            aria-label="Favoritos"
            className="text-ink transition-colors hover:text-caramel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </Link>
          <Link
            href="https://www.instagram.com/modelle_unica/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-ink transition-colors hover:text-caramel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Nav mobile */}
      <nav className="flex items-center justify-center gap-5 border-t border-line py-2 text-[11px] uppercase tracking-widest text-ink-soft md:hidden">
        <Link href="/catalogo">Catálogo</Link>
        <Link href="/sobre">Sobre</Link>
        <Link href="/contato">Contato</Link>
        <Link href="/medidas">Medidas</Link>
      </nav>
    </header>
  );
}
