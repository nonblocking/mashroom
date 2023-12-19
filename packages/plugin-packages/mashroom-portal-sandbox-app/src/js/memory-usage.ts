
export default (): Promise<number | undefined> => {
    if (global.crossOriginIsolated && global.performance && 'measureUserAgentSpecificMemory' in global.performance) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return global.performance.measureUserAgentSpecificMemory().then((measure) => {
            return measure.bytes;
        });
    }
    if (global.performance && 'memory' in global.performance) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return Promise.resolve(global.performance.memory.usedJSHeapSize);
    }
    return Promise.resolve(undefined);
};
