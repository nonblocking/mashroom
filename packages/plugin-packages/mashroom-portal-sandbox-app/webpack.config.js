
const path = require('path');

module.exports = (env, argv) => {

    const entry = {
        'bundle': [path.resolve(__dirname, 'src/js')]
    };

    if (argv.mode === 'development') {
        // Add portal theme
        entry.bundle = [path.resolve(__dirname, '../mashroom-portal-default-theme/src/frontend/sass/style.scss')].concat(entry.bundle);
        // Add dummy portal app
        entry.dummyAppBundle = [path.resolve(__dirname, 'src/js/dummy_app')];
    }

    return {
        entry,
        output: {
            path: __dirname + '/dist',
            filename: '[name].js',
        },
        target: ['web', 'es5'],
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    exclude: [/node_modules/, /mashroom-portal-ui-commons/],
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
                    test: /\.(ts|js|tsx)$/,
                    exclude: /node_modules\/(?!nanoid)/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                configFile: path.resolve(__dirname, '.babelrc')
                            },
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
                            options: {
                                url: false
                            }
                        },
                        {
                            loader: 'sass-loader',
                        },
                    ]
                },
            ],
        },
        externals: [],
        resolve: {
            extensions: ['.js', '.ts', '.tsx'],
            modules: [
                __dirname + '/node_modules',
                __dirname + '/node_modules/@mashroom/mashroom-portal-ui-commons/node_modules',
            ],
            alias: {
                // Only for dev mode when the theme is included
                './assets/random-grey-variations.png': path.resolve(__dirname, '../mashroom-portal-default-theme/src/assets/random-grey-variations.png'),
            },
        },
        devServer: {
            inline: true,
            host: '0.0.0.0',
            disableHostCheck: true,
            port: 8095,
            contentBase: 'src',
            open: true,
        },
    };

};
