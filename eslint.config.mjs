import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Company logos are user-supplied images of unknown origin; next/image optimisation does not apply.
      "@next/next/no-img-element": "off",
      // Geist is loaded once in the root layout, which covers every page in the App Router.
      "@next/next/no-page-custom-font": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "design/**", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;
