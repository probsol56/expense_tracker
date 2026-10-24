import { describe, expect, it } from "vitest";
import { getCategoryOptions } from "@/lib/category-options";

describe("getCategoryOptions", () => {
  it("returns unique non-empty category names supplied by the workspace", () => {
    expect(getCategoryOptions(["Salary", "Freelance", "Salary", ""])).toEqual(["Salary", "Freelance"]);
  });
});
