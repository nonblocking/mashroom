import {mergeStackTrace} from './error-utils';

export default class ResourceFetchAbortedError extends Error {
    constructor(message: string, rootCause?: Error) {
        super(message);
        this.name = 'ResourceFetchAbortedError';
        if (rootCause) {
            this.stack = mergeStackTrace(this.stack ?? '', rootCause.stack);
        }
    }
}
