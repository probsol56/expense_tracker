import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading overview">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-1 h-10 w-64" />
        </div>
        <Skeleton className="h-11 w-44" />
      </div>

      <div className="mb-10 grid gap-6 border-b-[3px] border-double border-rule pb-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)] lg:gap-8">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-12 w-64" />
          <Skeleton className="mt-2 h-5 w-48" />
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="self-end">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-8 w-36" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
        <Skeleton className="h-96" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
