import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

/** @type {import("eslint").Linter.Config[]} */
export const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export const nestConfig = [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
];

export const nextConfig = [
  ...baseConfig,
  {
    rules: {
      "react/react-in-jsx-scope": "off",
    },
  },
];
