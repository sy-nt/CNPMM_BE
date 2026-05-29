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
            "no-eval": "error",
            "no-implied-eval": "error",
            "no-useless-concat": "error",
            "no-useless-return": "error",
            "prefer-arrow-callback": "error",

            // 🧹 General clean code rules
            "prefer-const": "error",
        },
    },
    {
        files: ["src/api/auth/**/*.ts"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: [
                                "@api/healthCheck/**",
                                "@api/shop/**",
                                "@api/user/**",
                                "**/api/healthCheck/**",
                                "**/api/shop/**",
                                "**/api/user/**",
                            ],
                            message:
                                "API modules must not import services from other API modules.",
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ["src/api/healthCheck/**/*.ts"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: [
                                "@api/auth/**",
                                "@api/shop/**",
                                "@api/user/**",
                                "**/api/auth/**",
                                "**/api/shop/**",
                                "**/api/user/**",
                            ],
                            message:
                                "API modules must not import services from other API modules.",
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ["src/api/shop/**/*.ts"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: [
                                "@api/auth/**",
                                "@api/healthCheck/**",
                                "@api/user/**",
                                "**/api/auth/**",
                                "**/api/healthCheck/**",
                                "**/api/user/**",
                            ],
                            message:
                                "API modules must not import services from other API modules.",
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ["src/api/user/**/*.ts"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: [
                                "@api/auth/**",
                                "@api/healthCheck/**",
                                "@api/shop/**",
                                "**/api/auth/**",
                                "**/api/healthCheck/**",
                                "**/api/shop/**",
                            ],
                            message:
                                "API modules must not import services from other API modules.",
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ["src/shared/**/*.ts"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["@api/**", "**/api/**"],
                            message: "Shared modules must not import from API modules.",
                        },
                    ],
                },
            ],
        },
    },
];
