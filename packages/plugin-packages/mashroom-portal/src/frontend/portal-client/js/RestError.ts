
import {errorUtils} from '@mashroom/mashroom-utils';

export class RestError extends Error {
    constructor(private statusCode: number, message: string, rootCauseStack?: string) {
        super(`HTTP ${statusCode}: ${message}`);
        // Because we are extending a built-in class
        Object.setPrototypeOf(this, RestError.prototype);
        this.name = 'RestError';
        this.stack = errorUtils.mergeStackTrace(this.stack ?? '', rootCauseStack);
    }

    getStatusCode(): number {
        return this.statusCode;
    }
}
