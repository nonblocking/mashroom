const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: __dirname + '/js/shared_lib',
    output: {
        path: __dirname + '/dist/bundle',
        filename: 'mashroom_portal_ui_common.js',
        chunkFilename: 'mashroom_portal_ui_common.[contenthash].js',
    },
    mode: 'production',
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
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
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
};
