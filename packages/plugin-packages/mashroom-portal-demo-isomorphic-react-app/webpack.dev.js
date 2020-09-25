const path = require('path');
const { merge } = require('webpack-merge');
const webpack = require('webpack');
const { HotModuleReplacementPlugin } = webpack
const HtmlWebpackPlugin = require('html-webpack-plugin');
const common = require('./webpack.config');

module.exports = merge(common, {
    entry: {
        bundle: ['webpack-hot-middleware/client?reload=true', 'react-hot-loader/patch', path.resolve(__dirname, 'src/frontend/js')],
    },
    mode: 'development',
    devtool: 'inline-source-map',
    plugins: [
        new HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
    ],
});
