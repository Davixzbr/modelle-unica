import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import { getSetting, getSiteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Sobre nós",
  description: "A história da Modelle Única: curadoria autêntica, caimento e atitude.",
};

export const revalidate = 300;

export default async function SobrePage() {
  const about = await getSetting("about");
  const policy = await getSetting("exchange_policy");
  const site = await getSiteConfig();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.3em] text-caramel">Nossa história</p>
        <h1 className="font-display mt-2 text-4xl text-ink sm:text-5xl">
          {(about?.title as string) || "Sobre a Modelle Única"}
        </h1>
      </Reveal>

      <Reveal className="zoom-frame relative mt-10 aspect-[16/9]">
        <Image
          src="/images/look-004.jpg"
          alt="Modelle Única"
          fill
          sizes="(max-width: 896px) 100vw, 896px"
          className="object-cover"
        />
      </Reveal>

      <Reveal className="prose mt-10 max-w-none">
        <p className="text-lg leading-relaxed text-ink-soft">
          {(about?.text as string) || ""}
        </p>
      </Reveal>

      <Reveal className="mt-14 grid gap-6 sm:grid-cols-3">
        {[
          { t: "Curadoria", d: "Cada peça é escolhida a mão — nada entra no acervo por acaso." },
          { t: "Exclusividade", d: "Edições limitadas e peças únicas para quem não gosta de ver a roupa no outro." },
          { t: "Atendimento", d: "Consultoria direta no WhatsApp, do tamanho ideal à combinação perfeita." },
        ].map((v) => (
          <div key={v.t} className="border-t-2 border-caramel pt-4">
            <p className="font-display text-xl text-ink">{v.t}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{v.d}</p>
          </div>
        ))}
      </Reveal>

      <Reveal className="mt-16 border-t border-line pt-10">
        <h2 className="font-display text-2xl text-ink">
          {(policy?.title as string) || "Política de trocas"}
        </h2>
        <p className="mt-4 leading-relaxed text-ink-soft">
          {(policy?.text as string) || ""}
        </p>
      </Reveal>
    </div>
  );
}
