
export default {
    appenders: {
        file: {
            type: 'file',
            filename: 'log/mashroom.log',
            maxLogSize: 10485760,
            numBackups: 3,
            layout: {
                type: 'pattern',
                pattern: '%d %p %X{clientIP} %X{username} %c - %m'
            },
        },
        console: {
            type: 'console',
            layout: {
                type: 'colored'
            },
        },
    },
    categories: {
        default: {
            appenders: ['file', 'console'],
            level: 'info'
        },
    }
};

