
const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {

    let entry = [path.resolve(__dirname, 'src/js')];

    if (argv.mode === 'development') {
        // Add portal theme
        entry.bundle = [path.resolve(__dirname, '../mashroom-portal-default-theme/dist/public/portal.css')].concat(entry.bundle);
    }

    return {
        entry,
        output: {
            path: __dirname + '/dist',
            filename: 'bundle.js',
        },
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'babel-loader',
                        },
                    ],
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: 'style-loader',
                        },
                        {
                            loader: 'css-loader',
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
                            options: {
                                url: false
                            }
                        },
                        {
                            loader: 'sass-loader',
                        },
                    ],
                    sideEffects: true,
                },
            ],
        },
        resolve: {
            extensions: ['.js', '.ts', '.tsx'],
            alias: {
                // Only for dev mode when the theme is included
                './assets/random-grey-variations.png': path.resolve(__dirname, '../mashroom-portal-default-theme/src/assets/random-grey-variations.png'),
            }
        },
        plugins: [
            new ESLintPlugin({
                extensions: ['.js', '.ts', '.tsx'],
                fix: true,
            })
        ],
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    extractComments: false,
                    terserOptions: {
                        format: {
                            comments: false,
                        },
                    },
                }),
            ],
        },
        devServer: {
            host: '0.0.0.0',
            allowedHosts: 'all',
            port: 8090,
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
