import type {Configuration} from 'log4js';

const config: Configuration = {
    appenders: {
        file: {
            type: 'file',
            filename: 'log/mashroom.log',
            maxLogSize: 10485760,
            backups: 3,
            layout: {
                type: 'pattern',
                pattern: '%d %p %X{sessionID} %X{clientIP} %X{browser} %X{browserVersion} %X{username} %c - %m'
            }
        },
        console: {
            type: 'console',
            layout: {
                type: 'colored'
            }
        }
    },
    categories: {
        default: {
            appenders: [
                'file',
                'console'
            ],
            level: 'debug'
        }
    }
}

export default config;
