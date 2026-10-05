import { isReceiptMimeType, MAX_RECEIPT_BYTES, type ReceiptMimeType } from "@/lib/receipts/constants";

// Browser-only. Re-encoding every image as a bounded JPEG keeps uploads and
// extraction tokens small, and drops EXIF metadata (GPS location, device) so
// it never reaches storage or the extractor.
const MAX_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

export class ReceiptFileError extends Error {
  constructor(readonly userMessage: string) {
    super(userMessage);
    this.name = "ReceiptFileError";
  }
}

const UNSUPPORTED = "Use a JPG, PNG, WebP or PDF receipt.";
const TOO_LARGE = "This receipt is larger than 10 MB. Use a smaller file.";

async function reencodeImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ReceiptFileError("This image couldn't be opened. Try another photo.");
  }

  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) throw new ReceiptFileError("Your browser couldn't process this image. Try a PDF instead.");
    // JPEG has no alpha; paint white so transparent PNG areas don't turn black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new ReceiptFileError("Your browser couldn't process this image. Try a PDF instead.");
    return blob;
  } finally {
    bitmap.close();
  }
}

export async function prepareReceiptFile(file: File): Promise<{ blob: Blob; mimeType: ReceiptMimeType }> {
  if (!isReceiptMimeType(file.type)) throw new ReceiptFileError(UNSUPPORTED);

  if (file.type === "application/pdf") {
    if (file.size > MAX_RECEIPT_BYTES) throw new ReceiptFileError(TOO_LARGE);
    return { blob: file, mimeType: "application/pdf" };
  }

  const blob = await reencodeImage(file);
  if (blob.size > MAX_RECEIPT_BYTES) throw new ReceiptFileError(TOO_LARGE);
  return { blob, mimeType: "image/jpeg" };
}
