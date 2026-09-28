"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PaginationBar } from "@/components/pagination-bar";
import type { PageInfo } from "@/lib/pagination";

/**
 * Pagination for a server-rendered list: the page lives in the URL under
 * `pageParam`, so the Server Component re-fetches just that page. Use a
 * distinct `pageParam` per list when a route pages more than one.
 */
export function UrlPaginationBar({
  pagination,
  pageParam = "page",
}: {
  pagination: PageInfo;
  pageParam?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Search-param-only navigations don't trigger loading.tsx, so track pending state here.
  const [isPending, startTransition] = useTransition();

  const goToPage = (page: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (page <= 1) next.delete(pageParam);
    else next.set(pageParam, String(page));
    const query = next.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return (
    <PaginationBar
      page={pagination.page}
      pageSize={pagination.pageSize}
      totalPages={pagination.totalPages}
      totalCount={pagination.totalCount}
      showPageSize={false}
      disabled={isPending}
      onPageChange={goToPage}
    />
  );
}
