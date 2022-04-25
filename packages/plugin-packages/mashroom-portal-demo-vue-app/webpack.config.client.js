
const { merge } = require("webpack-merge");
const common = require('./webpack.config.common');

module.exports = merge(common,  {
    entry: __dirname + '/src/js',
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js',
    },
    target: ['web', 'es5'],
    devServer: {
        host: '0.0.0.0',
        allowedHosts: 'all',
        port: 8092,
        static: 'src',
        open: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        }
    },
});
