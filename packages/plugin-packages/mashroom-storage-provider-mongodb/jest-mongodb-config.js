module.exports = {
    mongodbMemoryServerOptions: {
        binary: {
            version: '7.0.16',
        },
        autoStart: false,
        instance: {
            dbName: 'jest',
        }
    }
};
