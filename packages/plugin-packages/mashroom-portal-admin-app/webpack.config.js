
const {resolve} = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {

    const entry = [];

    if (argv.mode === 'development') {
        // Add portal theme
        entry.push(resolve(__dirname, '../mashroom-portal-default-theme/dist/public/portal.css'));
        entry.push(resolve(__dirname, '../mashroom-portal-default-theme/dist/public/admin.css'));
    }

    entry.push(resolve(__dirname, 'src/js'));

    return {
        entry,
        output: {
            path: `${__dirname  }/dist`,
            filename: 'admin-toolbar.js',
            chunkFilename: 'admin-toolbar.[contenthash].js',
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
                    ]
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: 'style-loader',
                        },
                        {
                            loader: 'css-loader',
                        },
                    ]
                },
                {
                    test: /\.scss$/,
                    use: [
                        {
                            loader: 'style-loader',
                        },
                        {
                            loader: 'css-loader',
                        },
                        {
                            loader: 'sass-loader',
                        },
                    ]
                },
            ],
        },
        resolve: {
            extensions: ['.js', '.ts', '.tsx'],
        },
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    extractComments: false,
                    terserOptions: {
                        format: {
                            comments: false,
                        },
                    },
                }),
            ],
        },
        devServer: {
            host: '0.0.0.0',
            allowedHosts: 'all',
            port: 8088,
            static: 'src',
            open: true,
            client: {
                overlay: {
                    errors: true,
                    warnings: false,
                },
            }
        },
    };

};
