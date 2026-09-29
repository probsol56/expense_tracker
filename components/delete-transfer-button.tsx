"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteTransferButton({
  transferId,
  action,
}: {
  transferId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("transfer_id", transferId);
      await action(formData);
      setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Delete transfer"
        className="grid h-11 w-11 place-items-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-brick/10 hover:text-brick"
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
      <ConfirmDialog
        open={open}
        title="Delete this transfer?"
        description="Both linked ledger entries will be removed and the account balances will be adjusted. This can't be undone."
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
