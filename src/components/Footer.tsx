import Link from "next/link";
import Icon from "@/components/Icon";

const INSTA = "https://www.instagram.com/modelle_unica/";

export default function Footer({
  whatsapp,
  whatsappDisplay,
  instagram,
  instagramHandle,
}: {
  whatsapp: string;
  whatsappDisplay?: string;
  instagram?: string;
  instagramHandle?: string;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="noise relative mt-24 border-t border-line bg-ink text-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {/* Marca */}
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-display text-[26px]">
            Modelle <span className="italic text-gold-soft">Única</span>
          </p>
          <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-cream/60">
            Peças selecionadas uma a uma, com caimento, qualidade e atitude. Esteja sempre em
            movimento.
          </p>
          <div className="mt-6 flex gap-2">
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 text-cream/70 transition-all hover:border-gold hover:text-gold-soft"
            >
              <Icon name="whatsapp" size={17} />
            </a>
            <a
              href={instagram || INSTA}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 text-cream/70 transition-all hover:border-gold hover:text-gold-soft"
            >
              <Icon name="instagram" size={17} />
            </a>
          </div>
        </div>

        {/* Navegação */}
        <div className="text-[13.5px]">
          <p className="kicker !text-cream/40 mb-4">Navegação</p>
          <ul className="space-y-2.5 text-cream/75">
            <li>
              <Link href="/catalogo" className="transition-colors hover:text-gold-soft">
                Catálogo completo
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="transition-colors hover:text-gold-soft">
                Sobre nós
              </Link>
            </li>
            <li>
              <Link href="/medidas" className="transition-colors hover:text-gold-soft">
                Guia de medidas
              </Link>
            </li>
            <li>
              <Link href="/favoritos" className="transition-colors hover:text-gold-soft">
                Meus favoritos
              </Link>
            </li>
            <li>
              <Link href="/contato" className="transition-colors hover:text-gold-soft">
                Contato
              </Link>
            </li>
          </ul>
        </div>

        {/* Atendimento */}
        <div className="text-[13.5px]">
          <p className="kicker !text-cream/40 mb-4">Atendimento</p>
          <ul className="space-y-2.5 text-cream/75">
            <li>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-gold-soft"
              >
                <Icon name="whatsapp" size={14} />
                {whatsappDisplay || "WhatsApp"}
              </a>
            </li>
            <li>
              <a
                href={instagram || INSTA}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-gold-soft"
              >
                <Icon name="instagram" size={14} />
                {instagramHandle || "@modelle_unica"}
              </a>
            </li>
          </ul>
        </div>

        {/* Ajuda */}
        <div className="text-[13.5px]">
          <p className="kicker !text-cream/40 mb-4">Ajuda</p>
          <ul className="space-y-2.5 text-cream/75">
            <li>
              <Link href="/medidas" className="transition-colors hover:text-gold-soft">
                Tabela de medidas
              </Link>
            </li>
            <li>
              <Link href="/medidas#trocas" className="transition-colors hover:text-gold-soft">
                Política de trocas
              </Link>
            </li>
            <li>
              <Link href="/favoritos" className="transition-colors hover:text-gold-soft">
                Lista de desejos
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-[11.5px] text-cream/35">
          <p>© {year} Modelle Única — Todos os direitos reservados.</p>
          <Link
            href="/admin"
            className="uppercase tracking-[0.16em] transition-colors hover:text-cream/70"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
