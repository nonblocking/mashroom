
module.exports = {
    entry: {
        'main': __dirname + '/src/frontend/js/main.ts'
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
