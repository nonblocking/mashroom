
module.exports = {
    entry: {
        'portal-client': `${__dirname  }/src/frontend/portal-client/js`,
        'welcome-app': `${__dirname  }/src/frontend/welcome-app/js`
    },
    output: {
        path: `${__dirname  }/dist/frontend`,
        filename: '[name].js',
        publicPath: '',
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)$/,
                exclude: /node_modules\/(?!nanoid)/,
                use: [
                    {
                        loader: 'babel-loader',
                    }
                ]
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'svg-inline-loader',
                    },
                ],
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.ts'],
    }
};
