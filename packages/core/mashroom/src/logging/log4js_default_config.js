
export default {
    appenders: {
        file: {type: 'file', filename: 'log/mashroom.log', maxLogSize: 10485760, numBackups: 3},
        console: {type: 'console'},
    },
    categories: {
        default: {appenders: ['file', 'console'], level: 'info'},
    }
};

