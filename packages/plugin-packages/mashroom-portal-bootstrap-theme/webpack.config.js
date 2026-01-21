
module.exports = {
    entry: {
        main: `${__dirname  }/src/frontend/js/main.ts`
    },
    output: {
        path: `${__dirname  }/dist/public`,
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                    },
                ],
            },
        ]
    }
};
