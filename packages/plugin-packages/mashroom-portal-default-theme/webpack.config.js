
module.exports = {
    entry: {
        'ie_polyfills': __dirname + '/src/frontend/js/ie_polyfills.ts'
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
