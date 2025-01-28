
const {merge} = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const common = require('./webpack.config.app.common');

module.exports = merge(common,  {
    entry: `${__dirname  }/src/js/indexAppSSR`,
    output: {
        path: `${__dirname  }/dist`,
        filename: 'app-ssr.js',
        library: {
            type: 'commonjs',
        },
    },
    externals: [nodeExternals({
        additionalModuleDirs: [`${__dirname }/../../../node_modules`]
    })],
    externalsPresets: { node: true },
    mode: 'none',
    optimization: {
        minimize: false,
    }
});
