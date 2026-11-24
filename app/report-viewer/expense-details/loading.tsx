import { ReportPageSkeleton } from "@/components/report-page-skeleton";

export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading expense details report" className="flex h-dvh flex-col bg-canvas">
      <ReportPageSkeleton className="min-h-0 flex-1" />
    </main>
  );
}
