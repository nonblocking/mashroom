
const mergeStackTrace = (stackTrace: string, rootCauseStackTrace: string | null | undefined): string => {
    if (!rootCauseStackTrace) {
        return stackTrace;
    }

    const entriesToMerge = stackTrace.split('\n');
    const baseEntries = rootCauseStackTrace.split('\n');

    const newEntries: Array<string> = [];
    entriesToMerge.forEach((entry) => {
        if (baseEntries.includes(entry)) {
            return;
        }
        newEntries.push(entry);
    });

    return [...newEntries, ...baseEntries].join('\n');
};

export class RestError extends Error {
    constructor(private statusCode: number, message: string, rootCauseStack?: string) {
        super(`HTTP ${statusCode}: ${message}`);
        // Because we are extending a built-in class
        Object.setPrototypeOf(this, RestError.prototype);
        this.name = 'RestError';
        this.stack = mergeStackTrace(this.stack ?? '', rootCauseStack);
    }

    getStatusCode(): number {
        return this.statusCode;
    }
}
