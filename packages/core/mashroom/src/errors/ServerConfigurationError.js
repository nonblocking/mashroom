
export default class ServerConfigurationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ServerConfigurationError';
    }
}
