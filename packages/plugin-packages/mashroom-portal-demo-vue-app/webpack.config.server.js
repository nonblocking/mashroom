
const {merge} = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const common = require('./webpack.config.common');

module.exports = merge(common,  {
    entry: __dirname + '/src/js/indexSSR',
    output: {
        path: __dirname + '/dist',
        filename: 'ssr.js',
        library: {
            type: 'commonjs',
        },
    },
    externals: [nodeExternals({
        allowlist: [/\.vue/]
    })],
    target: 'node',
    mode: 'none',
    optimization: {
        minimize: false,
    },
});
