
module.exports = {
    entry: `${__dirname  }/src/page-enhancement/openMicrofrontendsClientBootstrapAdapter.ts`,
    output: {
        path: `${__dirname  }/dist/public`,
        filename: 'openMicrofrontendsClientBootstrapAdapter.js',
    },
    devtool: 'source-map',
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
        ]
    },
    resolve: {
        extensions: ['.js', '.ts'],
    }
};
