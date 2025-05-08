
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    let entries = [
        path.resolve(__dirname, 'src')
    ];

    if (argv.mode === 'development') {
        // Add portal theme
        entries = [path.resolve(__dirname, '../mashroom-portal-default-theme/dist/public/portal.css')].concat(entries);
    }

    return {
        entry: entries,
        output: {
            path: `${__dirname  }/dist`,
            filename: 'bundle.js',
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
                            options: {
                                modules: {
                                    namedExport: false,
                                    exportLocalsConvention: 'as-is',
                                }
                            }
                        },
                        {
                            loader: 'sass-loader',
                        },
                    ]
                },
                {
                    test: /\.svg$/,
                    use: [
                        {
                            loader: 'svg-inline-loader',
                        },
                    ],
                }
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
            port: 8033,
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
