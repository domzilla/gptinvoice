const eslint = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const prettier = require('eslint-config-prettier');

module.exports = [
    eslint.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                URL: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            // TypeScript-specific rules
            ...tseslint.configs.recommended.rules,

            // Style rules matching the style guide
            'indent': ['error', 4],
            'quotes': ['error', 'single', { avoidEscape: true }],
            'semi': ['error', 'always'],

            // Best practices
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-function-return-type': ['warn', {
                allowExpressions: true,
                allowTypedFunctionExpressions: true,
            }],
            '@typescript-eslint/no-explicit-any': 'warn',

            // Disabled rules
            'no-undef': 'off', // TypeScript handles this
        },
    },
    {
        files: ['**/*.test.ts'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                jest: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/explicit-function-return-type': 'off',
        },
    },
    {
        ignores: ['dist/**', 'node_modules/**', '*.js'],
    },
    prettier,
];
