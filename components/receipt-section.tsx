"use client";

import { useRef, useState } from "react";
import { Camera, ExternalLink, Receipt, Upload, X } from "lucide-react";
import { extractReceipt, getReceiptViewUrl, prepareReceiptUpload } from "@/app/receipt-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Alert, Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { RECEIPT_MIME_TYPES, RECEIPTS_BUCKET } from "@/lib/receipts/constants";
import type { ReceiptDraft } from "@/lib/receipts/draft";
import { hashReceiptBlob, prepareReceiptFile, ReceiptFileError } from "@/lib/receipts/prepare-file";

export type ScannedReceipt = {
  path: string;
  /** null when the file uploaded but couldn't be read: it is still attached. */
  draft: ReceiptDraft | null;
};

type ScanStatus = "idle" | "uploading" | "reading";
type ScanSource = "camera" | "file";

// Camera capture only makes sense where `capture` opens one; desktops would
// just show a second file picker.
const TOUCH_ONLY = "hidden [@media(pointer:coarse)]:inline-flex";
const CAMERA_MIME_TYPES = RECEIPT_MIME_TYPES.filter((type) => type.startsWith("image/"));

// Another tab finished uploading the same file between our check and upload.
function isAlreadyUploaded(error: Error): boolean {
  return "code" in error && error.code === "ResourceAlreadyExists";
}

const STATUS_TEXT: Record<Exclude<ScanStatus, "idle">, string> = {
  uploading: "Uploading receipt…",
  reading: "Reading receipt…",
};

interface ReceiptSectionProps {
  receiptPath: string | null;
  warnings: string[];
  canScan: boolean;
  /** Line items already in the form; a scan replaces them, so confirm first. */
  existingItemCount: number;
  onScanned: (receipt: ScannedReceipt) => void;
  onRemove: () => void;
}

export function ReceiptSection({ receiptPath, warnings, canScan, existingItemCount, onScanned, onRemove }: ReceiptSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [source, setSource] = useState<ScanSource>("file");
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [fileAwaitingConfirm, setFileAwaitingConfirm] = useState<File | null>(null);

  function resetFileInput() {
    // Allow picking the same file again after a failure or a cancel.
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  // Confirm before uploading so a cancelled scan doesn't use up the daily quota.
  function pickFile(file: File, pickedFrom: ScanSource) {
    setSource(pickedFrom);
    if (existingItemCount > 0) setFileAwaitingConfirm(file);
    else void scan(file);
  }

  async function scan(file: File) {
    setError(null);
    setStatus("uploading");
    try {
      const prepared = await prepareReceiptFile(file);
      const upload = await prepareReceiptUpload(prepared.mimeType, await hashReceiptBlob(prepared.blob));
      if ("error" in upload) {
        setError(upload.error);
        return;
      }

      if (!upload.alreadyUploaded) {
        const { error: uploadError } = await createClient()
          .storage.from(RECEIPTS_BUCKET)
          .uploadToSignedUrl(upload.path, upload.token, prepared.blob, { contentType: prepared.mimeType });
        if (uploadError && !isAlreadyUploaded(uploadError)) {
          setError("The upload failed. Check your connection and try again.");
          return;
        }
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
      resetFileInput();
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
            ref={fileInputRef}
            type="file"
            accept={RECEIPT_MIME_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) pickFile(file, "file");
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept={CAMERA_MIME_TYPES.join(",")}
            capture="environment"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) pickFile(file, "camera");
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className={`flex-1 ${TOUCH_ONLY}`}
              onClick={() => cameraInputRef.current?.click()}
              disabled={busy && source !== "camera"}
              loading={busy && source === "camera"}
              loadingText={busy ? STATUS_TEXT[status] : undefined}
            >
              <Camera aria-hidden="true" /> Take photo
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy && source !== "file"}
              loading={busy && source === "file"}
              loadingText={busy ? STATUS_TEXT[status] : undefined}
            >
              <Upload aria-hidden="true" /> Upload receipt
            </Button>
          </div>
          <p className="text-xs text-fg-muted">
            Photo or PDF. Scans are processed by Google Gemini, which may use them to improve its services.
          </p>
        </>
      ) : null}

      <p aria-live="polite" className="sr-only">{busy ? STATUS_TEXT[status] : ""}</p>

      <ConfirmDialog
        open={fileAwaitingConfirm !== null}
        title="Replace the line items?"
        description={`The scanned receipt replaces the ${existingItemCount} line item${existingItemCount === 1 ? "" : "s"}, tax and discount in this form. Merchant, category and date are updated if the receipt shows them.`}
        confirmLabel="Scan and replace"
        onConfirm={() => {
          const file = fileAwaitingConfirm;
          setFileAwaitingConfirm(null);
          if (file) void scan(file);
        }}
        onCancel={() => {
          setFileAwaitingConfirm(null);
          resetFileInput();
        }}
      />

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
