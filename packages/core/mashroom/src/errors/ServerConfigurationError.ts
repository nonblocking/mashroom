
export default class ServerConfigurationError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'ServerConfigurationError';
    }
}
