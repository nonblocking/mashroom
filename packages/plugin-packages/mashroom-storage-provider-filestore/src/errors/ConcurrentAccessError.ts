
export default class ConcurrentAccessError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConcurrentAccessError';
    }
}
