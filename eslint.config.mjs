import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([{
    extends: [...next],
}, {
    ignores: [
        "**/.next/**",
        "**/.next-dev/**",
        "android/app/src/main/assets/public/**",
        "next-build/**",
    ],
}, {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["lib/safe.ts"],
    rules: {
        "no-restricted-properties": ["error",
            { object: "crypto", property: "randomUUID", message: "Use safeUUID() from lib/safe.ts." },
            { object: "navigator", property: "clipboard", message: "Use safeCopy() from lib/safe.ts." },
            { property: "localStorage", message: "Use safeStorage from lib/safe.ts." },
            { property: "sessionStorage", message: "Use safeStorage from lib/safe.ts." },
        ],
        "no-restricted-globals": ["error",
            { name: "localStorage", message: "Use safeStorage from lib/safe.ts." },
            { name: "sessionStorage", message: "Use safeStorage from lib/safe.ts." },
        ],
    },
}, {
    files: ["lib/safe.ts"],
    rules: {
        "no-restricted-properties": "off",
        "no-restricted-globals": "off",
    },
}]);
