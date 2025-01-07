import pluginAngular from '@angular-eslint/eslint-plugin';
import pluginAngularTemplate from '@angular-eslint/eslint-plugin-template';
import defaultConfig from '../../../build-config/eslint.default.mjs';

export default [
    ...defaultConfig, {
        rules: {
            '@typescript-eslint/consistent-type-imports': 'off',
        }
    }, {
        plugins: {
            '@angular-eslint': pluginAngular,
        },
        rules: {
            ...pluginAngular.configs.recommended.rules,
            '@angular-eslint/component-selector': [
                'error',
                {
                    prefix: 'app',
                    style: 'kebab-case',
                    type: 'element'
                }
            ],
            '@angular-eslint/directive-selector': [
                'error',
                {
                    prefix: 'app',
                    style: 'camelCase',
                    type: 'attribute'
                }
            ],
            '@angular-eslint/no-empty-lifecycle-method': 'off'
        }
    }, {
        files: ['*.html'],
        plugins: {
            '@angular-eslint/template': pluginAngularTemplate,
        },
        rules: {
            ...pluginAngularTemplate.configs.recommended.rules,
        }
    }
];
