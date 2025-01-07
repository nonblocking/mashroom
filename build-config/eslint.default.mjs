import globals from 'globals';
import js from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import tsParser from '@typescript-eslint/parser';
import pluginTypescript from '@typescript-eslint/eslint-plugin';
import pluginJest from 'eslint-plugin-jest';

export default [{
    ignores: [
        'dist/*',
        'lib/*',
        'test-data/*',
        'type-definitions/*.js'
    ],
}, {
    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.browser,
            ...globals.jest,
            ...globals.jasmine,
        },
    },
    rules: {
        ...js.configs.recommended.rules,
        'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
        'quote-props': ["error", "as-needed"],
        'semi': ['error', 'always'],
        'prefer-template': 'error',
        'prefer-object-spread': 'error',
        'no-unused-vars': 'warn',
    }
}, {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
        '@typescript-eslint': pluginTypescript,
    },
    languageOptions: {
        parser: tsParser,
    },
    rules: {
        'no-undef': 'off',
        ...pluginTypescript.configs.recommended.rules,
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-require-imports': 'warn',
        '@typescript-eslint/no-namespace': 'off',
    },
}, {
    plugins: {
        import: pluginImport,
    },
    rules: {
        'import/no-useless-path-segments': 'error',
        'import/prefer-default-export': 'warn',
        'import/default': 'error',
        'import/export': 'error',
        'import/order': ['error', {
            groups: [
                'builtin',
                'external',
                'internal',
                'parent',
                'sibling',
                'index',
                'object',
                'type',
            ],
        }],
        'import/no-duplicates': 'error',
    }
}, {
    plugins: {
        jest: pluginJest,
    },
    rules: {
        ...pluginJest.configs.recommended.rules,
        'jest/no-done-callback': 'off',
        'jest/no-conditional-expect': 'warn'
    }
}];
