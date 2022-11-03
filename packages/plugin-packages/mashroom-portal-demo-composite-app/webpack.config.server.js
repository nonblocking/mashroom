
const {merge} = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');

module.exports ={
    entry: __dirname + '/src/js/indexAppSSR',
    output: {
        path: __dirname + '/dist',
        filename: 'app-ssr.js',
        library: {
            type: 'commonjs',
        },
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
        ],
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
    },
    externals: [nodeExternals()],
    target: 'node',
    mode: 'none'
};
