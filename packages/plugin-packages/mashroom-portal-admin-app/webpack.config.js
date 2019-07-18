
const path = require('path');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');

module.exports = (env, argv) => {

    let entry = [path.resolve(__dirname, 'src/js/index')];

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
        bail: true,
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
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
                    test: /\.svg$/,
                    use: [
                        {
                            loader: 'svg-inline-loader',
                        },
                    ],
                },
                {
                    test: /\.(png|gif|jpg|jpeg|ttf|eot|woff(2)?)$/,
                    use: [
                        {
                            loader: 'file-loader',
                        },
                    ],
                },
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
                'hoist-non-react-statics': path.resolve(__dirname, 'node_modules/hoist-non-react-statics'),
                'object-assign': path.resolve(__dirname, 'node_modules/object-assign'),
                '@mashroom/mashroom-portal-ui-commons': path.resolve(__dirname, 'node_modules/@mashroom/mashroom-portal-ui-commons'),
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
            port: 8088,
            contentBase: 'src',
            open: true,
        },
    };

};
