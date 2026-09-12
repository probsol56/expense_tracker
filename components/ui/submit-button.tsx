"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface SubmitButtonProps extends ButtonProps {
  loadingText?: string;
}

export function SubmitButton({
  children,
  loadingText = "Saving...",
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      {...props}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? loadingText : children}
    </Button>
  );
}
