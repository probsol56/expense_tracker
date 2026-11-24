import { Skeleton } from "@/components/ui";
import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Loading expense report">
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
      <Skeleton className="h-[70vh] min-h-[32rem] rounded-lg" />
    </PageSkeleton>
  );
}
