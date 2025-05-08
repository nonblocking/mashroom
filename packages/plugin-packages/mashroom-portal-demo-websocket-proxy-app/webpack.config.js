const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: `${__dirname  }/src/js`,
    output: {
        path: `${__dirname  }/dist`,
        filename: 'bundle.js',
    },
    devtool: 'source-map',
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
            }
        ],
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
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
        port: 8089,
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
