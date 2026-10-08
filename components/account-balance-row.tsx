"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { deleteLedgerAccount } from "@/app/(app)/accounts/actions";
import type { Account } from "@/lib/types";
import { money } from "@/lib/utils";

export function AccountBalanceRow({ account, currency }: { account: Account; currency: string }) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const { showToast } = useToast();
    const accountType = account.account_type?.replace("_", " ") || "deposit";

    const handleConfirm = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set("account_id", account.id);
            const result = await deleteLedgerAccount(formData);
            if ("error" in result) {
                showToast(`${account.name}: ${result.error}`, "error");
                setConfirmOpen(false);
                return;
            }
            showToast(`${account.name} deleted.`, "success");
            setConfirmOpen(false);
        });
    };

    return (
        <>
            <tr className="border-b border-rule last:border-b-0">
                <td className="break-words px-4 py-3 align-top">
                    <p className="font-medium text-fg">{account.name}</p>
                    <p className="text-sm text-fg-muted">
                        <span className="capitalize sm:hidden">{accountType}</span>
                        {account.institution && (
                            <>
                                <span className="sm:hidden"> · </span>
                                {account.institution}
                            </>
                        )}
                    </p>
                </td>
                <td className="hidden px-4 py-3 align-top text-sm capitalize text-fg-muted sm:table-cell">{accountType}</td>
                <td
                    className={`border-l border-brass/40 px-4 py-3 text-right align-top font-medium tabular-nums ${Number(account.balance) < 0 ? "text-brick" : "text-fg"
                        }`}
                >
                    {money(Number(account.balance), currency)}
                </td>
                <td className="px-1 py-1.5 align-top">
                    <button
                        type="button"
                        onClick={() => setConfirmOpen(true)}
                        aria-label={`Delete account ${account.name}`}
                        title={`Delete account ${account.name}`}
                        className="grid h-11 w-11 place-items-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-brick/10 hover:text-brick focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brick"
                    >
                        <Trash2 size={16} aria-hidden="true" />
                    </button>
                </td>
            </tr>
            <ConfirmDialog
                open={confirmOpen}
                title={`Delete ${account.name}?`}
                description="This permanently deletes the account. Accounts with transactions can't be deleted; delete or reassign those transactions first."
                confirmLabel="Delete account"
                pending={pending}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    );
}