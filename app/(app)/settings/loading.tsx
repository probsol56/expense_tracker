import { Skeleton } from "@/components/ui";
import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Loading settings" width="max-w-2xl">
      <Skeleton className="h-80 rounded-lg" />
      <Skeleton className="mt-10 h-48 rounded-lg" />
    </PageSkeleton>
  );
}
