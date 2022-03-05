
const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = (env, argv) => {

    let entry = [path.resolve(__dirname, 'src/js')];

    if (argv.mode === 'development') {
        // Add portal theme
        entry = [path.resolve(__dirname, '../mashroom-portal-default-theme/src/frontend/sass/style.scss')].concat(entry);
    }

    return {
        entry,
        output: {
            path: __dirname + '/dist',
            filename: 'bundle.js',
        },
        target: ['web', 'es5'],
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
                __dirname + '/node_modules',
                __dirname + '/node_modules/@mashroom/mashroom-portal-ui-commons/node_modules',
                __dirname + '/../../../node_modules',
            ]
        },
        plugins: [
            new ESLintPlugin({
                extensions: ['.js', '.ts', '.tsx'],
                fix: true,
            })
        ],
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
