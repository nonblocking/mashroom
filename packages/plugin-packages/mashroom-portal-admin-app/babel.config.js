// In order to compile the code in mashroom-portal-ui-commons as well we have to use
// babel.config.js instead of .babel.rc - see https://github.com/babel/babel/issues/7890

module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    browsers: [
                        'last 2 versions',
                        'ie >= 11'
                    ]
                },
                useBuiltIns: 'entry'
            }
        ],
        '@babel/preset-react',
        '@babel/preset-flow'
    ],
    plugins: [
        '@babel/plugin-syntax-dynamic-import'
    ]
};
