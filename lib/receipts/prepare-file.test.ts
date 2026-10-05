import { describe, expect, it } from "vitest";
import { hashReceiptBlob } from "@/lib/receipts/prepare-file";
import { RECEIPT_CONTENT_HASH_PATTERN } from "@/lib/receipts/constants";

describe("hashReceiptBlob", () => {
  it("returns the hex SHA-256 of the blob", async () => {
    expect(await hashReceiptBlob(new Blob(["abc"]))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("gives identical files the same name and different files different names", async () => {
    const first = await hashReceiptBlob(new Blob(["receipt"]));
    expect(await hashReceiptBlob(new Blob(["receipt"]))).toBe(first);
    expect(await hashReceiptBlob(new Blob(["receipt2"]))).not.toBe(first);
    expect(first).toMatch(RECEIPT_CONTENT_HASH_PATTERN);
  });
});
