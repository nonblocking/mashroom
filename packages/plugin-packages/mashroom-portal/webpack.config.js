
module.exports = {
    entry: {
        'portal-client': __dirname + '/src/frontend/portal-client/js',
        'welcome-app': __dirname + '/src/frontend/welcome-app/js'
    },
    output: {
        path: __dirname + '/dist/frontend',
        filename: '[name].js'
    },
    bail: true,
    module: {
        rules: [
            {
                test: /\.(ts)$/,
                exclude: [/node_modules/, /mashroom-utils/],
                enforce: 'pre',
                use: [
                    {
                        loader: 'eslint-loader',
                        options: {
                            fix: true,
                            configFile: __dirname + '/.eslintrc.json'
                        }
                    }
                ]
            },
            {
                test: /\.(ts)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader'
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
                test: /\.(png|gif|jpg|jpeg|svg|ttf|eot|woff(2)?)$/,
                use: [
                    {
                        loader: 'file-loader'
                    }
                ]
            }
        ]
    },
    externals: [],
    resolve: {
        extensions: ['.js', '.ts']
    }
};
