
export default async (): Promise<number | undefined> => {
    if (global.crossOriginIsolated && global.performance && 'measureUserAgentSpecificMemory' in global.performance) {
        // @ts-ignore
        return global.performance.measureUserAgentSpecificMemory().then((measure) => {
            return measure.bytes;
        });
    }
    if (global.performance && 'memory' in global.performance) {
        // @ts-ignore
        return global.performance.memory.usedJSHeapSize;
    }
    return undefined;
};
