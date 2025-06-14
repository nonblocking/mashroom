
const { merge } = require('webpack-merge');
const common = require('./webpack.config.common');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(common(false),  {
    entry: {
        bundle: ['./src/index.ts']
    },
    resolve: {
        extensions: ['.mjs', '.js', '.ts', '.svelte'],
        mainFields: ['svelte', 'browser', 'module', 'main'],
        conditionNames: ['svelte', 'browser'],
    },
    output: {
        path: __dirname + '/public',
        filename: '[name].js',
        chunkFilename: '[name].[id].js'
    },
    devtool: 'source-map',
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
        port: 8081,
        static: 'public',
        open: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        }
    },
});
