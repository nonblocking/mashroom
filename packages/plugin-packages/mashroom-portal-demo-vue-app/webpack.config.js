
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
        inline: true,
        host: '0.0.0.0',
        disableHostCheck: true,
        port: 8092,
        contentBase: 'src',
        open: true,
    },
};
