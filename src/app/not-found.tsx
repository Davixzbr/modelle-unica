import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-32 text-center sm:py-40">
      <div className="hairline mx-auto mb-10 max-w-[180px]">
        <span aria-hidden />
      </div>
      <p className="kicker">Erro 404</p>
      <h1 className="font-display mt-3 text-4xl text-ink sm:text-5xl">Página não encontrada</h1>
      <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-ink-soft">
        O endereço que você acessou não existe ou a peça saiu do catálogo.
      </p>
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href="/catalogo" className="btn btn-solid">
          Voltar ao catálogo
        </Link>
        <Link href="/" className="btn btn-outline">
          Ir para a Home
        </Link>
      </div>
    </div>
  );
}
