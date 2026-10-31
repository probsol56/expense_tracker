"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { deleteCategory, updateCategory } from "@/app/(app)/categories/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CategoryBadge } from "@/components/category-badge";
import { Button, Input } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/toast-provider";

type CategoryRowProps = {
  category: {
    id: string;
    name: string;
    color: string;
  };
};

export function CategoryRow({ category }: CategoryRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleSave = async (formData: FormData) => {
    const result = await updateCategory(formData);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    setEditing(false);
    showToast("Category updated.", "success");
  };

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
        {editing ? (
          <form action={handleSave} className="flex min-w-0 flex-1 items-center gap-2">
            <input type="hidden" name="category_id" value={category.id} />
            <Input
              aria-label={`Category name for ${category.name}`}
              autoFocus
              name="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={category.name}
              className="min-w-0"
            />
            <SubmitButton size="sm" variant="primary" loadingText="Saving...">
              Save
            </SubmitButton>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Cancel editing category"
              onClick={() => setEditing(false)}
            >
              <X aria-hidden="true" />
            </Button>
          </form>
        ) : (
          <>
            <CategoryBadge name={category.name} color={category.color} />
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Edit ${category.name}`}
                title={`Edit ${category.name}`}
                onClick={() => setEditing(true)}
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
          </>
        )}
      </li>
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
