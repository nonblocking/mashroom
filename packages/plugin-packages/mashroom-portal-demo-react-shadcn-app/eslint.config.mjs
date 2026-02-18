import defaultConfig from '../../../build-config/eslint.default.mjs';
import reactConfig from '../../../build-config/eslint.react.mjs';

export default [
    ...defaultConfig,
    ...reactConfig,
];
