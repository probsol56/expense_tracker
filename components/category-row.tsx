"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteCategory } from "@/app/(app)/categories/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CategoryBadge } from "@/components/category-badge";
import { Button } from "@/components/ui";
import { CategoryEditDialog } from "@/components/category-edit-dialog";
import { useToast } from "@/components/toast-provider";

type CategoryRowProps = {
  category: {
    id: string;
    name: string;
    color: string;
  };
};

export function CategoryRow({ category }: CategoryRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("category_id", category.id);
      const result = await deleteCategory(formData);
      if ("error" in result) {
        showToast(result.error, "error");
        setConfirmOpen(false);
        return;
      }

      showToast("Category deleted.", "success");
      setConfirmOpen(false);
    });
  };

  return (
    <>
      <li className="flex min-h-14 items-center justify-between gap-2 border-b border-rule py-1.5 last:border-b-0">
        <CategoryBadge
          name={category.name}
          color={category.color}
          className="flex-1"
        />
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Edit ${category.name}`}
            title={`Edit ${category.name}`}
            onClick={() => setEditOpen(true)}
          >
            <Pencil aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Delete ${category.name}`}
            title={`Delete ${category.name}`}
            className="text-fg-muted hover:bg-brick/10 hover:text-brick"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </li>
      {editOpen && (
        <CategoryEditDialog
          category={category}
          onClose={() => setEditOpen(false)}
        />
      )}
      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${category.name}?`}
        description="A category can't be deleted while transactions use it. Reassign or delete those transactions first."
        confirmLabel="Delete category"
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
