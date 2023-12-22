
export default class ResourceTypeNotSupportedError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'UnsupportedResourceTypeError';
    }
}
