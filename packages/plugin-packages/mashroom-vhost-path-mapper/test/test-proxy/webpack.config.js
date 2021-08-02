
module.exports = {
    context: __dirname,
    entry: './index.js',
    devServer: {
        contentBase: __dirname,
        compress: true,
        port: 8888,
        disableHostCheck: true,
        open: true,
        proxy: {
            '/mashroom-portal/*':{
                target: 'http://localhost:5050',
                pathRewrite: {'^/mashroom-portal' : ''},
                ws: true
            },
        },
    },
};
