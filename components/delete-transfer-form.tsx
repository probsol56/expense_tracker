"use client";

import { Trash2 } from "lucide-react";

const CONFIRM_MESSAGE =
  "Delete this transfer? Both linked ledger entries will be removed and the account balances will be adjusted.";

export function DeleteTransferForm({
  transferId,
  action,
}: {
  transferId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(CONFIRM_MESSAGE)) event.preventDefault();
      }}
    >
      <input type="hidden" name="transfer_id" value={transferId} />
      <button
        type="submit"
        aria-label="Delete transfer"
        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
      >
        <Trash2 size={14} />
      </button>
    </form>
  );
}
