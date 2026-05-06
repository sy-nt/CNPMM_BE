import pluginJs from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    perfectionist.configs["recommended-alphabetical"],
    {
        languageOptions: {
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
        rules: {
            // 🧠 TypeScript
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "all",
                    argsIgnorePattern: "^_",
                    caughtErrors: "all",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                    varsIgnorePattern: "^_",
                },
            ],
            eqeqeq: ["error", "always"],
            "max-lines-per-function": [
                "error",
                {
                    max: 45,
                    skipBlankLines: true,
                    skipComments: true,
                },
            ],
            "no-console": "error",
            "no-eval": "error",
            "no-implied-eval": "error",
            "no-useless-concat": "error",
            "no-useless-return": "error",
            "prefer-arrow-callback": "error",

            // 🧹 General clean code rules
            "prefer-const": "error",
        },
    },
];
