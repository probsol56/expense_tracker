import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "supabase/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // Phase 3 (boundary-validation) removed every existing violation of these two.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      // no-floating-promises needs type-aware linting (a `project` parserOption),
      // not yet set up here — leave it off rather than turn it on toothlessly.
      "no-empty": "warn",
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
);
