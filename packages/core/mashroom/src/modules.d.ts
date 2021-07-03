
type Callback = (digestErr: Error | null, packageDigest: string | null) => void;
type IgnoreFunction = (path: string, filename: string) => boolean;

declare module 'lucy-dirsum' {
    export default function digestDirectory(path: string, callback: Callback, ignoreFunction: IgnoreFunction): RegExp;
}
