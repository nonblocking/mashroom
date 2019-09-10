
module.exports = {
    entry:  __dirname + '/src/frontend/test_client.js',
    output: {
        path: __dirname + '/dist/public',
        filename: 'test_client.js'
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
