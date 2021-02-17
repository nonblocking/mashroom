
export const getNestedProperty = (object: any | undefined | null, path: string): any | undefined | null => {
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

export const deepAssign = (targetObj: any, ...sourceObjs: any[]): any => {
    if (!sourceObjs || sourceObjs.length === 0) {
        return targetObj;
    }

    for (let i = 0; i < sourceObjs.length; i++) {
        const sourceObj = sourceObjs[i];
        mergeObjects(targetObj, sourceObj);
    }

    return targetObj;
};

const mergeObjects = <T>(targetObj: T, sourceObj: T): void => {
    if (isObject(targetObj) && isObject(sourceObj)) {
        for (const key in sourceObj) {
            if (Object.prototype.hasOwnProperty.call(sourceObj, key)) {
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

export const isObject = (item: any | undefined | null) => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};
