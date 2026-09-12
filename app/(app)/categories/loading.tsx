import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl">
        <Skeleton className="h-7 w-40 rounded-xl" />

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="mt-2 h-8 w-72" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
    </div>
  );
}
