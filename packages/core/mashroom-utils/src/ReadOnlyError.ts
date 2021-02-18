
export default class ReadOnlyError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'ReadOnlyError';
    }
}
