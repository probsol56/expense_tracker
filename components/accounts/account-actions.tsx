import Link from "next/link";
import { Plus, Repeat, WalletCards } from "lucide-react";
import { Button } from "@/components/ui";

export function AccountActions({ month }: { month: string }) {
  return (
    <div className="mb-8 flex flex-wrap gap-3" aria-label="Account actions">
      <Button asChild variant="primary">
        <Link href={`/accounts?addAccount=1&month=${month}`} scroll={false}>
          <WalletCards aria-hidden="true" /> Add account
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href={`/accounts?addIncome=1&month=${month}`} scroll={false}>
          <Plus aria-hidden="true" /> Add money
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href={`/accounts?transfer=1&month=${month}`} scroll={false}>
          <Repeat aria-hidden="true" /> Transfer
        </Link>
      </Button>
    </div>
  );
}
