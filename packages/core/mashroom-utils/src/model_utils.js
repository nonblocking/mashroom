// @flow

export const getNestedProperty = (object: ?Object, path: string): ?any => {
    if (!object) {
        return null;
    }

    const [firstProperty, ...rest] = path.split('.');
    if (rest.length > 0 && object[firstProperty]) {
        return getNestedProperty(object[firstProperty], rest.join('.'));
    }
    if (object[firstProperty]) {
        return object[firstProperty];
    }
    return null;
};

export const deepAssign = (targetObj: Object, ...sourceObjs: Object[]): Object => {
    if (!sourceObjs || sourceObjs.length === 0) {
        return targetObj;
    }

    for (let i = 0; i < sourceObjs.length; i++) {
        const sourceObj = sourceObjs[i];
        mergeObjects(targetObj, sourceObj);
    }

    return targetObj;
};

const mergeObjects = <T: Object>(targetObj: T, sourceObj: T): void => {
    if (isObject(targetObj) && isObject(sourceObj)) {
        for (const key in sourceObj) {
            if (sourceObj.hasOwnProperty(key)) {
                if (isObject(sourceObj[key])) {
                    if (!targetObj[key]) {
                        Object.assign(targetObj, {[key]: {}});
                    }
                    deepAssign(targetObj[key], sourceObj[key]);
                } else {
                    Object.assign(targetObj, {[key]: sourceObj[key]});
                }
            }
        }
    }
};

export const isObject = (item: ?any) => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};
