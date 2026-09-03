"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <p className="font-display text-7xl text-caramel">404</p>
      <h1 className="font-display mt-4 text-3xl text-ink">Página não encontrada</h1>
      <p className="mt-4 text-ink-soft">
        O endereço que você acessou não existe ou a peça saiu do catálogo.
      </p>
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/catalogo"
          className="rounded-full bg-ink px-8 py-3.5 text-[12px] font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-caramel"
        >
          Ver catálogo
        </Link>
        <Link
          href="/"
          className="rounded-full border border-line px-8 py-3.5 text-[12px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-ink"
        >
          Ir para a Home
        </Link>
      </div>
    </div>
  );
}
