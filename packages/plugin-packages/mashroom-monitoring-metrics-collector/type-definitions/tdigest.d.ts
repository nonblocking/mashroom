
declare module 'tdigest' {
    export class TDigest {
        push(value: number, times?: number): void;
        compress(): void;
        percentile(quantile: number): number;
        reset(): void;
    }
}
