import { describe, expect, it } from "vitest";
import { AUTH_ROUTES, authCallbackUrl, safeNextPath } from "./auth-routes";

describe("safeNextPath", () => {
  it("keeps same-origin paths", () => {
    expect(safeNextPath("/reset-password")).toBe("/reset-password");
    expect(safeNextPath("/transactions?page=2")).toBe("/transactions?page=2");
  });

  it.each([null, undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "evil.com"])(
    "falls back to home for %s",
    (value) => {
      expect(safeNextPath(value)).toBe(AUTH_ROUTES.home);
    },
  );
});

describe("authCallbackUrl", () => {
  it("builds an absolute callback URL carrying next", () => {
    expect(authCallbackUrl("https://wallo.app", AUTH_ROUTES.resetPassword)).toBe(
      "https://wallo.app/auth/callback?next=%2Freset-password",
    );
  });
});
