"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <p className="font-display text-3xl text-ink">Algo deu errado</p>
      <p className="mt-4 text-ink-soft">
        Não conseguimos carregar esta página agora. Verifique sua conexão e tente de novo.
      </p>
      <button
        onClick={reset}
        className="mt-10 rounded-full bg-ink px-8 py-3.5 text-[12px] font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-caramel"
      >
        Tentar novamente
      </button>
    </div>
  );
}
