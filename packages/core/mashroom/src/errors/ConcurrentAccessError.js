
export default class ConcurrentAccessError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConcurrentAccessError';
    }
}
