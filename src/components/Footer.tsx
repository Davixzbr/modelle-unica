import Link from "next/link";

const INSTA = "https://www.instagram.com/modelle_unica/";

export default function Footer({ whatsapp }: { whatsapp: string }) {
  return (
    <footer className="noise relative mt-24 border-t border-line bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl">
            Modelle <span className="italic text-caramel">Única</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/70">
            Peças selecionadas uma a uma. Esteja sempre em movimento.
          </p>
        </div>

        <div className="text-sm">
          <p className="mb-3 text-[11px] uppercase tracking-widest text-cream/50">
            Navegação
          </p>
          <ul className="space-y-2 text-cream/80">
            <li><Link href="/catalogo" className="hover:text-caramel">Catálogo completo</Link></li>
            <li><Link href="/sobre" className="hover:text-caramel">Sobre nós</Link></li>
            <li><Link href="/medidas" className="hover:text-caramel">Guia de medidas</Link></li>
            <li><Link href="/favoritos" className="hover:text-caramel">Meus favoritos</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="mb-3 text-[11px] uppercase tracking-widest text-cream/50">
            Atendimento
          </p>
          <ul className="space-y-2 text-cream/80">
            <li>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-caramel"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a href={INSTA} target="_blank" rel="noopener noreferrer" className="hover:text-caramel">
                Instagram @modelle_unica
              </a>
            </li>
          </ul>
          <Link
            href="/admin"
            className="mt-6 inline-block text-[11px] uppercase tracking-widest text-cream/40 hover:text-cream/70"
          >
            Admin
          </Link>
        </div>
      </div>

      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} Modelle Única — Todos os direitos reservados.
      </div>
    </footer>
  );
}
