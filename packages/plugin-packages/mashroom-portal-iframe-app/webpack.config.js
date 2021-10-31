const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
    entry: __dirname + '/src/js',
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js',
    },
    target: ['web', 'es5'],
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
            }
        ],
    },
    externals: [],
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
    },
    plugins: [
        new ESLintPlugin({
            extensions: ['.js', '.ts', '.tsx'],
            fix: true,
        })
    ],
    devServer: {
        host: '0.0.0.0',
        allowedHosts: 'all',
        port: 8091,
        static: 'src',
        open: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        }
    },
};
