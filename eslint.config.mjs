import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin"; // Update plugin import
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["node_modules", "dist"],
  },
  // Base config for JavaScript files
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      // globals: globals.browser,
      globals:{
        ...globals.browser, 
        ...globals.node
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-unused-expressions": "error",
      "prefer-const": "error",
      "no-console": "warn",
    },
    ...pluginJs.configs.recommended,
  },

  
  // TypeScript-specific configuration
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      // globals: globals.browser,
      globals: {
        ...globals.browser,
        ...globals.node,
      }
    },
    plugins: { "@typescript-eslint": tseslint }, // Ensure correct plugin usage
    rules: {
      "@typescript-eslint/no-explicit-any": "warn", // Set as warning
      "no-unused-vars": "warn",
      "no-unused-expressions": "error",
      "prefer-const": "error",
      "no-console": "warn",
      "explicit-module-boundary-types": "off", // Example: Disable explicit return types rule
    },
  },
];
