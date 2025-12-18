
module.exports = {
    entry: `${__dirname  }/src/app1`,
    output: {
        path: `${__dirname  }/dist`,
        filename: 'index1.js',
        libraryTarget: 'system',
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                    },
                ],
            },
        ],
    },
    externalsType: 'system',
    externals: {
        react: 'react',
        'react-dom': 'react-dom',
        'react-dom/client': 'react-dom/client',
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
    },
    devServer: {
        host: '0.0.0.0',
        allowedHosts: 'all',
        port: 9991,
        static: 'src/app1',
        open: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        }
    },
};
