
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {

    const entry = {
        sandbox: [path.resolve(__dirname, 'src/js')]
    };

    if (argv.mode === 'development') {
        // Add portal theme
        entry.sandbox = [path.resolve(__dirname, '../mashroom-portal-default-theme/dist/public/portal.css')].concat(entry.sandbox);
        // Add dummy portal app
        entry.dummyAppBundle = [path.resolve(__dirname, 'src/js/dummy-app')];
    }

    return {
        entry,
        output: {
            path: `${__dirname  }/dist`,
            filename: '[name].js',
            chunkFilename: 'sandbox.[contenthash].js',
        },
        devtool: 'source-map',
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
                    test: /\.css$/,
                    use: [
                        {
                            loader: 'style-loader',
                        },
                        {
                            loader: 'css-loader',
                        },
                    ]
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
        resolve: {
            extensions: ['.js', '.ts', '.tsx'],
        },
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
