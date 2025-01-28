
const {merge} = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const common = require('./webpack.config.common');

module.exports = merge(common(true),  {
    entry: './src/indexSSR',
    output: {
        path: __dirname + '/public',
        filename: 'ssr.js',
        library: {
            type: 'commonjs',
        },
    },
    externals: [nodeExternals({
        additionalModuleDirs: [`${__dirname }/../../../node_modules`],
    })],
    externalsPresets: { node: true },
    mode: 'none',
    optimization: {
        minimize: false,
    },
});
