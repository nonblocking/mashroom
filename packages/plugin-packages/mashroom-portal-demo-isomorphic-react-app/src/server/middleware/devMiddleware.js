import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpack from 'webpack';
import webpackConfig from '../../../webpack.dev';

const bundler = webpack(webpackConfig);
const devMiddleware = [
    webpackDevMiddleware(bundler, {
        filename: webpackConfig.output.filename,
        publicPath: webpackConfig.output.publicPath,
    }),
    webpackHotMiddleware(bundler),
];

module.exports = devMiddleware;
