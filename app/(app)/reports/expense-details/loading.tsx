import { Skeleton } from "@/components/ui";
import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Loading expense report">
      <div className="flex max-w-xl flex-col gap-5 rounded-lg border border-rule p-5 sm:p-6">
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="ml-auto h-10 w-36" />
      </div>
    </PageSkeleton>
  );
}
