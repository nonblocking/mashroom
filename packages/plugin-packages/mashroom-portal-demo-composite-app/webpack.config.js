
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
        extensions: ['.js', '.ts', '.tsx'],
    },
    devServer: {
        host: '0.0.0.0',
        allowedHosts: 'all',
        port: 8088,
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