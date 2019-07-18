
module.exports = {
    entry: {
        'ie_polyfills': __dirname + '/src/frontend/js/ie_polyfills.js'
    },
    output: {
        path: __dirname + '/dist/public',
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
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
