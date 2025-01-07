
import ReadOnlyError from './ReadOnlyError';

export const cloneAndFreezeObject = <T>(obj: T): Readonly<T> => Object.freeze({...obj});

export const cloneAndFreezeArray = <T>(arr: Array<T>): Readonly<Array<T>> => Object.freeze([...arr]);

export const createReadonlyProxy = createReadonlyProxyImpl;

function createReadonlyProxyImpl<T extends object>(target: T, logger?: { warn: (msg: string) => void }): T {
    return new Proxy<T>(target, {
        get: function (target, name) {
            if (!(name in target)) {
                if (logger) logger.warn(`Attempt to access non existent property: ${String(name)}`);
                return undefined;
            }

            // @ts-ignore
            const val = target[name];
            if (val) {
                if (Array.isArray(val)) {
                    return cloneAndFreezeArray(val);
                } else if (typeof (val) === 'object') {
                    return createReadonlyProxy(val, logger);
                }
            }
            return val;
        },
        set: function (target, name) {
            throw new ReadOnlyError(`Attempt to set property on read-only object: ${String(name)}`);
        },
    });
}
