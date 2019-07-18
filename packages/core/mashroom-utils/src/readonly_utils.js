// @flow

import ReadOnlyError from './ReadOnlyError';

export const cloneAndFreezeObject = <T: Object> (obj: T): T => Object.freeze(Object.assign({}, obj));

export const cloneAndFreezeArray = <T> (arr: Array<T>): Array<T> => Object.freeze([...arr]);

export const createReadonlyProxy = createReadonlyProxyImpl;

function createReadonlyProxyImpl<T: Object>(target: T, logger?: { warn: (msg: string) => void }): T {
    return (new Proxy(target, {
        get: function(target, name) {
            if (!(name in target)) {
                if (logger) logger.warn(`Attempt to access non existent property: ${name}`);
                return undefined;
            }

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
        set: function(target, name, value) {
            throw new ReadOnlyError(`Attempt to set property on read-only object: ${name}`);
        },
    }): any);
}

export default {
    cloneAndFreezeObject,
    cloneAndFreezeArray,
    createReadonlyProxy,
};
