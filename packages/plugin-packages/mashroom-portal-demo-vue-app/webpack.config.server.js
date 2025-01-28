
const {merge} = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const common = require('./webpack.config.common');

module.exports = merge(common,  {
    entry: `${__dirname  }/src/js/indexSSR`,
    output: {
        path: `${__dirname  }/dist`,
        filename: 'ssr.js',
        library: {
            type: 'commonjs',
        },
    },
    externals: [nodeExternals({
        additionalModuleDirs: [`${__dirname }/../../../node_modules`],
        allowlist: [/\.vue/]
    })],
    externalsPresets: { node: true },
    mode: 'none',
    optimization: {
        minimize: false,
    },
});
