import {mergeStackTrace} from './error-utils';

export default class ResourceFetchError extends Error {
    constructor(message: string, rootCause?: Error) {
        super(message);
        this.name = 'ResourceFetchError';
        if (rootCause) {
            this.stack = mergeStackTrace(this.stack ?? '', rootCause.stack);
        }
    }
}
