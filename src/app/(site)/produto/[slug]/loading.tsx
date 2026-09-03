import { Skeleton } from "@/components/States";

/** Skeleton da página de produto (primeiro load / navegação). */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-32 pt-8 lg:pb-16 lg:pt-14" aria-busy="true" aria-label="Carregando produto">
      <Skeleton className="mb-8 h-3 w-48" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="mt-4 hidden gap-3 lg:flex">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-[74px]" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-4 h-10 w-3/4" />
          <Skeleton className="mt-3 h-4 w-full max-w-md" />
          <Skeleton className="mt-2 h-4 w-2/3 max-w-sm" />
          <Skeleton className="mt-8 h-9 w-40" />
          <Skeleton className="mt-8 h-px w-full" />
          <div className="mt-7">
            <Skeleton className="h-3 w-24" />
            <div className="mt-3 flex gap-2.5">
              {["P", "M", "G", "GG"].map((s) => (
                <Skeleton key={s} className="h-12 w-14 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="mt-7">
            <Skeleton className="h-3 w-16" />
            <div className="mt-3 flex gap-2.5">
              <Skeleton className="h-12 w-24 rounded-lg" />
              <Skeleton className="h-12 w-24 rounded-lg" />
            </div>
          </div>
          <div className="mt-8 hidden gap-3 lg:flex">
            <Skeleton className="h-14 flex-1 rounded-full" />
            <Skeleton className="h-14 flex-1 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
