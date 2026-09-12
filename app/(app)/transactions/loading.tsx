import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl">
      <Skeleton className="h-8 w-40 rounded-lg" />
      <Skeleton className="mt-8 h-96 rounded-2xl" />
    </div>
  );
}
