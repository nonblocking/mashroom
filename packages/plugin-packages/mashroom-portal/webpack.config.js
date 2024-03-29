const ESLintPlugin = require('eslint-webpack-plugin');

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
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        'targets': {
                                            'browsers': [
                                                'last 2 versions',
                                                'ie >= 11'
                                            ]
                                        }
                                    }
                                ],
                                '@babel/preset-typescript'
                            ]
                        }
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
    },
    plugins: [
        new ESLintPlugin({
            extensions: ['.js', '.ts'],
            fix: true,
        })
    ]
};
