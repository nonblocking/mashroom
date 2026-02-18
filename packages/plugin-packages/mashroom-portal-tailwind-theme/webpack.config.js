const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: {
        main: [
            `${__dirname  }/src/frontend/style/portal.css`,
            `${__dirname  }/src/frontend/js/main.ts`
        ],
        admin: [
            `${__dirname  }/src/frontend/style/admin.css`
        ],
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
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader'
                ],
            },
        ]
    },
    plugins: [new MiniCssExtractPlugin({
        filename: '[name].css',
    })]
};
