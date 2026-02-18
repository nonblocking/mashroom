const { resolve } = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: [
        `${__dirname  }/src/globals.css`,
        `${__dirname  }/src/index.tsx`,
    ],
    output: {
        path: `${__dirname  }/dist`,
        filename: 'bundle.js',
    },
    devtool: 'source-map',
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
                test: /\.css$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    'postcss-loader',
                ],
            },
            {
                rules: [
                    {
                        test: /\.svg/,
                        type: 'asset/resource',
                    },
                ],
            }
        ],
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
        alias: {
            '@': resolve(__dirname, 'src'),
        },
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
        port: 8098,
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
