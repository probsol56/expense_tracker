import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="mt-2 h-9 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* 3 Metric Cards skeleton */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-7">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>

      {/* Main Grid skeleton */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}


