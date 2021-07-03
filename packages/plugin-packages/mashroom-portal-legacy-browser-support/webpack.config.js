
module.exports = {
    entry: {
        'polyfills': __dirname + '/src/frontend/polyfills.ts'
    },
    output: {
        path: __dirname + '/dist/public',
        filename: '[name].js'
    },
    target: ['web', 'es5'],
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
