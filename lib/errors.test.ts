import { describe, expect, it, vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { toActionError, toCaughtActionError } from "@/lib/errors";

function postgrestError(code: string, message: string): PostgrestError {
  return { code, message, details: "", hint: "", name: "PostgrestError", toJSON: () => ({ code, message, details: "", hint: "", name: "PostgrestError" }) };
}

describe("toActionError", () => {
  it("shows the message from a deliberate raise exception (P0001)", () => {
    expect(toActionError(postgrestError("P0001", "Payment exceeds the remaining balance."), "fallback")).toBe(
      "Payment exceeds the remaining balance.",
    );
  });

  it("falls back to the generic message and logs for anything else", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(toActionError(postgrestError("23503", "insert or update violates foreign key constraint"), "Failed to save.")).toBe(
      "Failed to save.",
    );
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("prefers a caller-supplied override for a specific code", () => {
    expect(
      toActionError(postgrestError("23505", "duplicate key value"), "Failed to save.", {
        "23505": "A holiday is already set for that date.",
      }),
    ).toBe("A holiday is already set for that date.");
  });
});

describe("toCaughtActionError", () => {
  it("maps a thrown Postgrest-shaped error the same way", () => {
    expect(toCaughtActionError(postgrestError("P0001", "Loan not found."), "fallback")).toBe("Loan not found.");
  });

  it("falls back for a plain Error and logs it", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(toCaughtActionError(new Error("boom"), "Failed to save.")).toBe("Failed to save.");
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
