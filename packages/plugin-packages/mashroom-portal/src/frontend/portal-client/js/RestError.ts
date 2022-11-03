
export class RestError extends Error {
    constructor(private statusCode: number, message: string, stack?: string) {
        super(`HTTP ${statusCode}: ${message}`);
        if (stack) {
            this.stack = stack;
        }

        // Because we are extending a built-in class
        Object.setPrototypeOf(this, RestError.prototype);
    }

    getStatusCode(): number {
        return this.statusCode;
    }
}
