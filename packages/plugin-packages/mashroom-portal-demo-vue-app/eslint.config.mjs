import pluginVue from 'eslint-plugin-vue';
import defaultConfig from '../../../build-config/eslint.default.mjs';

export default [
    ...defaultConfig, {
        plugins: {
            vue: pluginVue,
        },
        rules: {
            ...pluginVue.configs.recommended.rules,
        }
    }
];
