import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-xl">
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
