import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Você está offline",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-soft text-gold-deep">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M2 8.8A15 15 0 0 1 12 5.5a15 15 0 0 1 10 3.3M5 12.5a10 10 0 0 1 7-2.7 10 10 0 0 1 7 2.7M8.5 16a5 5 0 0 1 7 0M12 19.5h.01" />
        </svg>
      </span>
      <h1 className="font-display mt-6 text-3xl text-ink sm:text-4xl">Você está offline</h1>
      <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink-soft">
        Sem internet agora. As páginas de produto que você já visitou continuam
        disponíveis — e o resto volta assim que a conexão voltar.
      </p>
      <Link href="/" className="btn btn-solid mt-9">
        Tentar novamente
      </Link>
    </div>
  );
}
