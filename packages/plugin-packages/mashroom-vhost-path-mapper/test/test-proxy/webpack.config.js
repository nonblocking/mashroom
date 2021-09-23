
module.exports = {
    context: __dirname,
    entry: './index.js',
    devServer: {
        static: __dirname,
        compress: true,
        port: 8888,
        allowedHosts: 'all',
        open: true,
        client: {
            overlay: {
                errors: false,
                warnings: false,
            },
        },
        proxy: {
            '/mashroom-portal/*':{
                target: 'http://localhost:5050',
                pathRewrite: {'^/mashroom-portal' : ''},
                ws: true
            },
        },
    },
};
