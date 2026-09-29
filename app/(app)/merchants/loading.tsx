import { Skeleton } from "@/components/ui";
import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Loading merchants">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </PageSkeleton>
  );
}
