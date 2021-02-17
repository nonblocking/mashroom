
export default class InitializationError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'InitializationError';
    }
}
