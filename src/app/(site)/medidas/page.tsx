import type { Metadata } from "next";
import { getSetting } from "@/lib/site-config";
import MedidasContent from "@/components/MedidasContent";

export const metadata: Metadata = {
  title: "Guia de medidas",
  description: "Guia de medidas e política de trocas da Modelle Única.",
};

export const revalidate = 300;

export default async function MedidasPage() {
  const policy = await getSetting("exchange_policy");

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-caramel">Vista-se bem</p>
      <h1 className="font-display mt-2 text-4xl text-ink sm:text-5xl">Guia de medidas</h1>
      <div className="mt-6">
        <MedidasContent policy={policy as { title?: string; text?: string } | null} />
      </div>
    </div>
  );
}
