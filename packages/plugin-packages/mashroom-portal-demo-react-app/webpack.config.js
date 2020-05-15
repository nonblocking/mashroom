
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
                test: /\.(js|jsx)$/,
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
                test: /\.(js|jsx)$/,
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
            },
            {
                test: /\.(png|gif|jpg|jpeg|ttf|eot|woff(2)?)$/,
                use: [
                    {
                        loader: 'file-loader',
                    },
                ],
            },
        ],
    },
    externals: [],
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    devServer: {
        inline: true,
        host: '0.0.0.0',
        disableHostCheck: true,
        port: 8088,
        contentBase: 'src',
        open: true,
    },
};
