module.exports = {
    mongodbMemoryServerOptions: {
        binary: {
            version: '5.0.20',
        },
        autoStart: false,
        instance: {
            dbName: 'jest',
        }
    }
};
