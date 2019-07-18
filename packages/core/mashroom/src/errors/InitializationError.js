
export default class InitializationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InitializationError';
    }
}
