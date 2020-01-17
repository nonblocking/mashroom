
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
        bail: true,
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: [/node_modules/, /mashroom-utils/],
                    enforce: 'pre',
                    use: [
                        {
                            loader: 'eslint-loader',
                            options: {
                                fix: false,
                                configFile: __dirname + '/.eslintrc.json',
                            },
                        },
                    ],
                },
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
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
                    ],
                    sideEffects: true,
                }
            ],
        },
        externals: [],
        resolve: {
            extensions: ['.js', '.jsx'],
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
                // Allow treeshaking of lodash modules
                'lodash': path.resolve(__dirname, 'node_modules/lodash-es'),
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
