const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
    entry: {
        'portal-client': __dirname + '/src/frontend/portal-client/js',
        'welcome-app': __dirname + '/src/frontend/welcome-app/js'
    },
    output: {
        path: __dirname + '/dist/frontend',
        filename: '[name].js',
        publicPath: '',
    },
    target: ['web', 'es5'],
    module: {
        rules: [
            {
                test: /\.(ts|js)$/,
                exclude: /node_modules\/(?!nanoid)/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            // Explicit config file for the node modules we need to transpile
                            configFile: __dirname + '/.babelrc.client'
                        }
                    }
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            },
            {
                test: /\.png/,
                type: 'asset/resource'
            }
        ]
    },
    externals: [],
    resolve: {
        extensions: ['.js', '.ts'],
    },
    plugins: [
        new ESLintPlugin({
            extensions: ['.js', '.ts'],
            fix: true,
        })
    ]
};
