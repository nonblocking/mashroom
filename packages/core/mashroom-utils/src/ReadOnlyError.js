
export default class ReadOnlyError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ReadOnlyError';
    }
}
