const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
    entry: __dirname + '/src/js',
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
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                    },
                    {
                        loader: 'sass-loader',
                    },
                ],
                sideEffects: true,
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'svg-inline-loader',
                    },
                ],
            }
        ],
    },
    externals: [],
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'bundle.css'
        }),
        new ESLintPlugin({
            extensions: ['.js', '.ts', '.tsx'],
            fix: true,
        })
    ],
    devServer: {
        host: '0.0.0.0',
        allowedHosts: 'all',
        port: 8088,
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