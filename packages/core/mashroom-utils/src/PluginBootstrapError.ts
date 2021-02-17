
export default class BootstrapError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'BootstrapError';
    }
}
