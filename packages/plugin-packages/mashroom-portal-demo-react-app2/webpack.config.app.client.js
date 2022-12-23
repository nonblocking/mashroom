const {merge} = require('webpack-merge');
const common = require('./webpack.config.app.common');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = merge(common,  {
    entry: __dirname + '/src/js/indexApp',
    output: {
        path: __dirname + '/dist',
        filename: 'app.js',
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
        port: 8087,
        static: 'test/app',
        open: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        }
    },
});
