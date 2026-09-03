import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import FavoritesCounterInline from "@/components/FavoritesCounterInline";
import { CartHeaderLink } from "@/components/CartCounterInline";
import Icon from "@/components/Icon";

export default async function Header() {
  const supabase = await createClient();
  const { data: cats } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("active", true)
    .order("sort_order");

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5">
        {/* Logo */}
        <Link href="/" className="font-display text-[22px] tracking-wide text-ink">
          Modelle <span className="italic text-gold-deep">Única</span>
        </Link>

        {/* Navegação desktop */}
        <nav className="hidden items-center gap-8 text-[12px] font-medium uppercase tracking-[0.18em] text-ink-soft lg:flex">
          <Link href="/catalogo" className="transition-colors hover:text-ink">
            Catálogo
          </Link>
          {(cats as { name: string; slug: string }[] | null)?.slice(0, 3).map((c) => (
            <Link
              key={c.slug}
              href={`/catalogo?cat=${c.slug}`}
              className="transition-colors hover:text-ink"
            >
              {c.name}
            </Link>
          ))}
          <Link href="/sobre" className="transition-colors hover:text-ink">
            Sobre
          </Link>
          <Link href="/contato" className="transition-colors hover:text-ink">
            Contato
          </Link>
        </nav>

        {/* Ações */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/catalogo"
            aria-label="Buscar no catálogo"
            className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-sand"
          >
            <Icon name="search" size={19} />
          </Link>
          <Link
            href="/favoritos"
            aria-label="Favoritos"
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-sand"
          >
            <Icon name="heart" size={19} />
            <FavoritesCounterInline />
          </Link>
          <CartHeaderLink />
          <a
            href="https://www.instagram.com/modelle_unica/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hidden h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-sand sm:grid"
          >
            <Icon name="instagram" size={19} />
          </a>
        </div>
      </div>

      {/* Nav mobile — compacta, rolável */}
      <nav
        className="flex items-center justify-start gap-6 overflow-x-auto border-t border-line/60 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft md:hidden"
        aria-label="Navegação mobile"
      >
        <Link href="/catalogo" className="flex-none hover:text-ink">Catálogo</Link>
        {(cats as { name: string; slug: string }[] | null)?.slice(0, 3).map((c) => (
          <Link key={c.slug} href={`/catalogo?cat=${c.slug}`} className="flex-none hover:text-ink">
            {c.name}
          </Link>
        ))}
        <Link href="/sobre" className="flex-none hover:text-ink">Sobre</Link>
        <Link href="/contato" className="flex-none hover:text-ink">Contato</Link>
        <Link href="/medidas" className="flex-none hover:text-ink">Medidas</Link>
      </nav>
    </header>
  );
}
