import pluginSolid from 'eslint-plugin-solid';
import defaultConfig from '../../../build-config/eslint.default.mjs';

export default [
    ...defaultConfig, {
        plugins: {
            solid: pluginSolid,
        },
        rules: {
            ...pluginSolid.configs['flat/typescript'].rules,
            'solid/no-destructure': 'off',
            'solid/no-innerhtml': 'warn',
        }
    }
];
