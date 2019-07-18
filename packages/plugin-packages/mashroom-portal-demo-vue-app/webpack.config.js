
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
    entry: __dirname + '/src/js/index',
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
                            fix: false,
                            configFile: __dirname + '/.eslintrc.json',
                        },
                    },
                ],
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    loaders: {
                        js: 'babel-loader'
                    }
                }
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
        // make sure to include the plugin!
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
