
export const mergeStackTrace = (stackTrace: string, rootCauseStackTrace: string | null | undefined): string => {
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
