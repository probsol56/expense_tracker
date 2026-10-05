"use client";

import { useRef, useState } from "react";
import { ExternalLink, Receipt, ScanLine, X } from "lucide-react";
import { extractReceipt, getReceiptViewUrl, prepareReceiptUpload } from "@/app/receipt-actions";
import { Alert, Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { RECEIPT_MIME_TYPES, RECEIPTS_BUCKET } from "@/lib/receipts/constants";
import type { ReceiptDraft } from "@/lib/receipts/draft";
import { prepareReceiptFile, ReceiptFileError } from "@/lib/receipts/prepare-file";

export type ScannedReceipt = {
  path: string;
  /** null when the file uploaded but couldn't be read: it is still attached. */
  draft: ReceiptDraft | null;
};

type ScanStatus = "idle" | "uploading" | "reading";

const STATUS_TEXT: Record<Exclude<ScanStatus, "idle">, string> = {
  uploading: "Uploading receipt…",
  reading: "Reading receipt…",
};

interface ReceiptSectionProps {
  receiptPath: string | null;
  warnings: string[];
  canScan: boolean;
  onScanned: (receipt: ScannedReceipt) => void;
  onRemove: () => void;
}

export function ReceiptSection({ receiptPath, warnings, canScan, onScanned, onRemove }: ReceiptSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  async function scan(file: File) {
    setError(null);
    setStatus("uploading");
    try {
      const prepared = await prepareReceiptFile(file);
      const upload = await prepareReceiptUpload(prepared.mimeType);
      if ("error" in upload) {
        setError(upload.error);
        return;
      }

      const { error: uploadError } = await createClient()
        .storage.from(RECEIPTS_BUCKET)
        .uploadToSignedUrl(upload.path, upload.token, prepared.blob, { contentType: prepared.mimeType });
      if (uploadError) {
        setError("The upload failed. Check your connection and try again.");
        return;
      }

      setStatus("reading");
      const result = await extractReceipt(upload.path);
      if ("error" in result) {
        setError(`${result.error} The receipt is still attached.`);
        onScanned({ path: upload.path, draft: null });
        return;
      }
      onScanned({ path: upload.path, draft: result.draft });
    } catch (caught: unknown) {
      setError(caught instanceof ReceiptFileError ? caught.userMessage : "Couldn't scan the receipt. Try again.");
    } finally {
      setStatus("idle");
      // Allow picking the same file again after a failure.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function openReceipt(path: string) {
    // Open synchronously so popup blockers allow it, then point it at the signed URL.
    const preview = window.open("about:blank", "_blank");
    setOpening(true);
    const result = await getReceiptViewUrl(path);
    setOpening(false);
    if ("error" in result) {
      preview?.close();
      setError(result.error);
      return;
    }
    if (preview) preview.location.href = result.url;
  }

  const busy = status !== "idle";

  return (
    <div className="space-y-2">
      {receiptPath ? (
        <div className="flex min-h-11 items-center gap-2 rounded-md border border-rule bg-canvas px-3">
          <Receipt size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
          <span className="flex-1 text-sm font-medium text-fg">Receipt attached</span>
          <Button type="button" variant="link" size="sm" onClick={() => void openReceipt(receiptPath)} loading={opening}>
            <ExternalLink aria-hidden="true" /> View
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove receipt">
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : canScan ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={RECEIPT_MIME_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void scan(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => inputRef.current?.click()}
            loading={busy}
            loadingText={busy ? STATUS_TEXT[status] : undefined}
          >
            <ScanLine aria-hidden="true" /> Scan a receipt
          </Button>
          <p className="text-xs text-fg-muted">
            Photo or PDF. Scans are processed by Google Gemini, which may use them to improve its services.
          </p>
        </>
      ) : null}

      <p aria-live="polite" className="sr-only">{busy ? STATUS_TEXT[status] : ""}</p>

      {error && <Alert>{error}</Alert>}
      {warnings.length > 0 && (
        <Alert tone="warning">
          <p className="font-medium">Check the scanned details before saving:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </Alert>
      )}
    </div>
  );
}
