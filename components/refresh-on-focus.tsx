"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const MIN_REFRESH_INTERVAL_MS = 5_000;

/**
 * Re-runs the current route's Server Components when the tab becomes visible
 * again, so edits made elsewhere (e.g. the Supabase dashboard) show up without
 * a manual reload. Client state such as open dialogs is preserved.
 */
export function RefreshOnFocus() {
  const router = useRouter();
  const lastRefreshAt = useRef(Date.now());

  useEffect(() => {
    function refreshIfStale() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefreshAt.current < MIN_REFRESH_INTERVAL_MS) return;

      lastRefreshAt.current = Date.now();
      router.refresh();
    }

    document.addEventListener("visibilitychange", refreshIfStale);
    window.addEventListener("focus", refreshIfStale);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfStale);
      window.removeEventListener("focus", refreshIfStale);
    };
  }, [router]);

  return null;
}
