
module.exports = {
    entry:  `${__dirname  }/src/frontend/test-client`,
    output: {
        path: `${__dirname  }/dist/public`,
        filename: 'test-client.js'
    },
    module: {
        rules: [
            {
                test: /\.(ts)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                    },
                ],
            },
        ]
    },
    resolve: {
        extensions: ['.ts'],
    },
};
