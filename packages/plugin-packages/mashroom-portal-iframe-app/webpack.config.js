
module.exports = {
    entry: __dirname + '/src/js',
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js',
    },
    bail: true,
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                enforce: 'pre',
                use: [
                    {
                        loader: 'eslint-loader',
                        options: {
                            fix: true,
                            configFile: __dirname + '/.eslintrc.json',
                        },
                    },
                ],
            },
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
    devServer: {
        inline: true,
        host: '0.0.0.0',
        disableHostCheck: true,
        port: 8091,
        contentBase: 'src',
        open: true,
    },
};
