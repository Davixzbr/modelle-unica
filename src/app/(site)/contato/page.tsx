import type { Metadata } from "next";
import ContatoForm from "./ContatoForm";
import { getSiteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a Modelle Única: WhatsApp e Instagram.",
};

export const revalidate = 300;

export default async function ContatoPage() {
  const site = await getSiteConfig();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-caramel">Atendimento</p>
      <h1 className="font-display mt-2 text-4xl text-ink sm:text-5xl">Fale conosco</h1>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <div className="space-y-8">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-ink-soft">WhatsApp</p>
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display mt-1 block text-2xl text-ink transition-colors hover:text-caramel"
            >
              {site.whatsappDisplay}
            </a>
            <p className="mt-2 text-sm text-ink-soft">
              Atendimento e vendas — respondemos rápido.
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-ink-soft">Instagram</p>
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display mt-1 block text-2xl text-ink transition-colors hover:text-caramel"
            >
              {site.instagramHandle}
            </a>
            <p className="mt-2 text-sm text-ink-soft">Lançamentos e novidades em primeira mão.</p>
          </div>

          {site.address && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-ink-soft">Endereço</p>
              <p className="font-display mt-1 text-2xl text-ink">{site.address}</p>
            </div>
          )}

          {site.hours && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-ink-soft">Horário de atendimento</p>
              <p className="font-display mt-1 text-2xl text-ink">{site.hours}</p>
            </div>
          )}
        </div>

        <div>
          <p className="mb-6 text-sm leading-relaxed text-ink-soft">
            Prefere escrever? Preencha abaixo e a mensagem chega direto no nosso WhatsApp:
          </p>
          <ContatoForm whatsappNumber={site.whatsapp} />
        </div>
      </div>
    </div>
  );
}
