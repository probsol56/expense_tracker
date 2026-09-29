import { Skeleton } from "@/components/ui";
import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Loading recurring" figures>
      <Skeleton className="h-80 rounded-lg" />
      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-8">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </PageSkeleton>
  );
}
