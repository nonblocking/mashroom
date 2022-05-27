
export const serializeObject = (obj: any): string => {
    if (typeof obj === 'string') {
        return obj;
    }
    if (obj instanceof Error) {
        return serializeError(obj);
    }
    return JSON.stringify(obj);
};

export const serializeError = (error: Error): string => {
    const errorObj: any = {
        name: error.name,
        message: error.message,
        stack: error.stack,
    };
    const msg = JSON.stringify(errorObj, null, 2);
    return msg.replace(/\\n/g, '\n');
};
