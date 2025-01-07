
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {

    let entry = [path.resolve(__dirname, 'src/js')];

    if (argv.mode === 'development') {
        // Add portal theme
        entry = [
            path.resolve(__dirname, '../mashroom-portal-default-theme/dist/public/portal.css'),
            path.resolve(__dirname, '../mashroom-portal-default-theme/dist/public/admin.css')
        ].concat(entry);
    }

    return {
        entry,
        output: {
            path: `${__dirname  }/dist`,
            filename: 'admin-toolbar.js',
            chunkFilename: 'admin-toolbar.[contenthash].js',
        },
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
            modules: [
                `${__dirname  }/node_modules`,
                `${__dirname  }/node_modules/@mashroom/mashroom-portal-ui-commons/node_modules`,
                `${__dirname  }/../../../node_modules`,
            ]
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
