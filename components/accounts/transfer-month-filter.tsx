"use client";

import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/ui";

export function TransferMonthFilter({
  month,
  maxMonth,
}: {
  month: string;
  maxMonth: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("month");
    if (typeof value !== "string" || !value) return;

    const query = new URLSearchParams({ month: value });
    startTransition(() => {
      router.push(`/accounts?${query.toString()}`, { scroll: false });
    });
  }

  return (
    <form action="/accounts" method="get" onSubmit={handleSubmit} className="mb-4 flex items-end gap-2">
      <Field label="Month" htmlFor="transfer-month" className="w-full max-w-56">
        <Input
          id="transfer-month"
          name="month"
          type="month"
          min="1900-01"
          max={maxMonth}
          defaultValue={month}
          required
        />
      </Field>
      <Button type="submit" variant="outline" loading={isPending} loadingText="Showing...">
        Show
      </Button>
    </form>
  );
}
