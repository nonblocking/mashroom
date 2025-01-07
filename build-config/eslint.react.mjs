import pluginReact from 'eslint-plugin-react';

export default [{
    files: ['**/*.tsx'],
    plugins: {
        react: pluginReact,
    },
    settings: {
        react: {
            version: 'detect',
        }
    },
    rules: {
        ...pluginReact.configs.flat.recommended.rules,
        'react/display-name': 'off',
    }
}];
