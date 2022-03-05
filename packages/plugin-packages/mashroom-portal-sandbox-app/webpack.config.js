
const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = (env, argv) => {

    const entry = {
        'bundle': [path.resolve(__dirname, 'src/js')]
    };

    if (argv.mode === 'development') {
        // Add portal theme
        entry.bundle = [path.resolve(__dirname, '../mashroom-portal-default-theme/src/frontend/sass/style.scss')].concat(entry.bundle);
        // Add dummy portal app
        entry.dummyAppBundle = [path.resolve(__dirname, 'src/js/dummy_app')];
    }

    return {
        entry,
        output: {
            path: __dirname + '/dist',
            filename: '[name].js',
        },
        target: ['web', 'es5'],
        module: {
            rules: [
                {
                    test: /\.(ts|js|tsx)$/,
                    exclude: /node_modules\/(?!nanoid)/,
                    use: [
                        {
                            loader: 'babel-loader',
                        },
                    ],
                },
                {
                    test: /\.scss$/,
                    use: [
                        {
                            loader: 'style-loader',
                        },
                        {
                            loader: 'css-loader',
                        },
                        {
                            loader: 'sass-loader',
                        },
                    ]
                },
            ],
        },
        externals: [],
        resolve: {
            extensions: ['.js', '.ts', '.tsx'],
            modules: [
                __dirname + '/node_modules',
                __dirname + '/node_modules/@mashroom/mashroom-portal-ui-commons/node_modules',
                __dirname + '/../../../node_modules',
            ]
        },
        plugins: [
            new ESLintPlugin({
                extensions: ['.js', '.ts', '.tsx'],
                fix: true,
            })
        ],
        devServer: {
            host: '0.0.0.0',
            allowedHosts: 'all',
            port: 8095,
            static: 'src',
            open: true,
            client: {
                overlay: {
                    errors: true,
                    warnings: false,
                },
            }
        },
    };

};
