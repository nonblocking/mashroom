
const { VueLoaderPlugin } = require('vue-loader')

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
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                    }
                ],
                sideEffects: true,
            }
        ],
    },
    externals: [],
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    plugins: [
        new VueLoaderPlugin()
    ],
    devServer: {
        host: '0.0.0.0',
        allowedHosts: 'all',
        port: 8092,
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
