// @ts-check
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "dist-demo/**", "coverage/**", "legacy/**", "officetohtml.js.org/**", "test/output/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-control-regex": "off",
    },
  },
);
