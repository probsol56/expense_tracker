import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl">
        <Skeleton className="h-7 w-40 rounded-xl" />

        <div className="mt-6">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="mt-2 h-8 w-72" />
          <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>

        <Skeleton className="mt-8 h-64 rounded-2xl" />
    </div>
  );
}
