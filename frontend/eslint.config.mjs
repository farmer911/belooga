import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Project guards (formerly source-grep unit tests). AST selectors, so formatting can't dodge them.
const projectGuards = [
  {
    selector:
      "CallExpression[callee.name=/^use(Layout)?Effect$/] MemberExpression[object.name=/^(apiClient|mobileApiClient)$/], CallExpression[callee.property.name=/^use(Layout)?Effect$/] MemberExpression[object.name=/^(apiClient|mobileApiClient)$/]",
    message: "Do not call apiClient inside useEffect; use @tanstack/react-query (useQuery/useMutation).",
  },
  {
    selector:
      "CallExpression[callee.property.name='catch'] > :matches(ArrowFunctionExpression, FunctionExpression) > BlockStatement[body.length=0]",
    message: "Do not swallow promise rejections with an empty .catch(); handle or surface the error.",
  },
  {
    selector: "TSAsExpression > TSAsExpression > TSUnknownKeyword",
    message: "Blind `as unknown as` casts are banned; narrow the value with a type guard.",
  },
  {
    selector: "Literal[value=/\\b(alexnguyen|alexrivera|hidden_jane|phucnguyen)\\b|alex@belooga\\.com/]",
    message: "Do not hard-code demo identities; use the signed-in user from useAuthStore.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-empty": ["error", { allowEmptyCatch: false }],
      "no-restricted-syntax": ["error", ...projectGuards],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
