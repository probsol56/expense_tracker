import { describe, expect, it } from "vitest";
import { getInitials } from "@/lib/utils";

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
