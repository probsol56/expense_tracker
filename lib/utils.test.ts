import { describe, expect, it } from "vitest";
import { getInitials, getLoanEditHref, isLoanCategory } from "@/lib/utils";

describe("getInitials", () => {
  it("uses the first and last word's initials", () => {
    expect(getInitials("Arif Islam")).toBe("AI");
    expect(getInitials("  mary  jane  watson ")).toBe("MW");
  });

  it("takes two letters from a single word", () => {
    expect(getInitials("arif")).toBe("AR");
  });

  it.each([null, undefined, "", "   "])("falls back to W for %j", (name) => {
    expect(getInitials(name)).toBe("W");
  });
});

describe("getLoanEditHref", () => {
  it("opens the matching loan editor when the transaction is linked to a loan", () => {
    expect(getLoanEditHref("loan-id")).toBe("/loans?edit=loan-id");
  });

  it("falls back to the loans page for unlinked loan entries", () => {
    expect(getLoanEditHref(null)).toBe("/loans");
  });
});

describe("isLoanCategory", () => {
  it("recognizes the dedicated loan ledger categories", () => {
    expect(isLoanCategory("Loan")).toBe(true);
    expect(isLoanCategory(" Mortgage ")).toBe(true);
  });

  it("does not mistake a regular category containing loan for a loan ledger entry", () => {
    expect(isLoanCategory("Personal loan")).toBe(false);
  });
});
