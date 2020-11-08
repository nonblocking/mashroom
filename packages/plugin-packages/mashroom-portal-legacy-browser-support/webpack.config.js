
module.exports = {
    entry: {
        'polyfills': __dirname + '/src/frontend/polyfills.ts'
    },
    output: {
        path: __dirname + '/dist/public',
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
