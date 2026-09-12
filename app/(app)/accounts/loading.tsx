import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl">
      <Skeleton className="h-8 w-40 rounded-lg" />
      <Skeleton className="mt-8 h-5 w-72 rounded-lg" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
