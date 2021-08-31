
const path = require('path');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');

module.exports = (env, argv) => {

    const entry = {
        'bundle': [path.resolve(__dirname, 'src/js')]
    };

    if (argv.mode === 'development') {
        // Add portal theme
        entry.bundle = [path.resolve(__dirname, '../mashroom-portal-default-theme/src/frontend/sass/style.scss')].concat(entry.bundle);
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
                    exclude: [/node_modules/, /mashroom-utils/, /mashroom-portal-ui-commons/],
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
                        },
                        {
                            loader: 'sass-loader',
                        },
                    ]
                },
                {
                    test: /random-grey-variations/,
                    use: 'null-loader',
                },
            ],
        },
        externals: [],
        resolve: {
            mainFields: ['browser', 'main', 'module'],
            extensions: ['.js', '.ts', '.tsx'],
            alias: {
                'react': path.resolve(__dirname, 'node_modules/react'),
                'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
                'react-intl': path.resolve(__dirname, 'node_modules/react-intl'),
                'react-redux': path.resolve(__dirname, 'node_modules/react-redux'),
                'redux': path.resolve(__dirname, 'node_modules/redux'),
                'redux-form': path.resolve(__dirname, 'node_modules/redux-form'),
                'react-is': path.resolve(__dirname, 'node_modules/react-is'),
                'shallow-equal': path.resolve(__dirname, 'node_modules/shallow-equal'),
                'hoist-non-react-statics': path.resolve(__dirname, 'node_modules/hoist-non-react-statics'),
                'object-assign': path.resolve(__dirname, 'node_modules/object-assign'),
                // Only for dev mode when the theme is included
                './assets/random-grey-variations.png': path.resolve(__dirname, '../mashroom-portal-default-theme/src/assets/random-grey-variations.png'),
            },
        },
        plugins: [
            new DuplicatePackageCheckerPlugin({
                emitError: true,
            })
        ],
        devServer: {
            inline: true,
            host: '0.0.0.0',
            disableHostCheck: true,
            port: 8098,
            contentBase: 'src',
            open: true,
        },
    };

};
