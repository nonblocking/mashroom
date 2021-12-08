const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
    entry: __dirname + '/src/js/indexEditor',
    output: {
        path: __dirname + '/dist',
        filename: 'editor.js',
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
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'svg-inline-loader',
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
        port: 8086,
        static: 'test/editor',
        open: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        }
    },
};
