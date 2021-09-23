
declare module 'ip-filter' {
    export default function(ip: string, patterns: string | Array<string>, options?: any): string | null;
}
