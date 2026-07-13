import angular from 'angular-eslint';
import defaultConfig from '../../../build-config/eslint.default.mjs';

export default [
    ...defaultConfig, {
        rules: {
            '@typescript-eslint/consistent-type-imports': 'off',
        }
    },
    ...angular.configs.tsRecommended,
    {
        files: ['*.html'],
        ...angular.configs.templateRecommended[0],
        ...angular.configs.templateRecommended[1],
    },
];
