
const path = require('path');

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
                    enforce: 'pre',
                    use: [
                        {
                            loader: 'eslint-loader',
                            options: {
                                fix: true,
                                configFile: __dirname + '/.eslintrc.json',
                            },
                        },
                    ],
                },
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
                    ],
                    sideEffects: true,
                },
                {
                    test: /random-grey-variations/,
                    use: 'null-loader',
                },
            ],
        },
        externals: [],
        resolve: {
            extensions: ['.js', '.ts', '.tsx'],
            alias: {
                // Only for dev mode when the theme is included
                './assets/random-grey-variations.png': path.resolve(__dirname, '../mashroom-portal-default-theme/src/assets/random-grey-variations.png'),
            }
        },
        devServer: {
            inline: true,
            host: '0.0.0.0',
            disableHostCheck: true,
            port: 8090,
            contentBase: 'src',
            open: true,
        },
    };

};
