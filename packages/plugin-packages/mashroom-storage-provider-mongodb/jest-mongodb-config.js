module.exports = {
    mongodbMemoryServerOptions: {
        binary: {
            version: '4.2.14',
            skipMD5: true
        },
        autoStart: false,
        instance: {
            dbName: 'jest',
        }
    }
};
