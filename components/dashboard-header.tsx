"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import type { Profile, Workspace } from "@/lib/types";

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({
  profile,
  workspace,
  onAdd,
}: {
  profile?: Profile | null;
  workspace?: Workspace | null;
  onAdd: () => void;
}) {
  const firstName =
    profile?.full_name?.trim().split(" ")[0] ||
    profile?.email?.split("@")[0] ||
    "there";

  // The visitor's clock only exists on the client; resolving it after mount
  // avoids a hydration mismatch with the server-rendered markup.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const period = now?.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <PageHeader
      eyebrow={
        <>
          {now ? `${greetingFor(now.getHours())}, ${firstName}` : null}
          {workspace?.name && now && <span aria-hidden="true"> · </span>}
          {workspace?.name}
        </>
      }
      title={<span className="block min-h-10">{period ?? "Overview"}</span>}
    >
      <Button variant="primary" onClick={onAdd} className="flex-1 px-5 sm:flex-none">
        <Plus size={16} aria-hidden="true" />
        Add transaction
      </Button>
    </PageHeader>
  );
}
