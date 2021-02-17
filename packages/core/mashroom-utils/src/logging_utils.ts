
export const dummyLoggerFactory = () => {
    const dummyLogger = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
        addContext: () => { /* nothing to do */ },
        withContext: () => dummyLogger,
        getContext: () => ({}),
    };

    return dummyLogger;
};

dummyLoggerFactory.bindToContext = () => dummyLoggerFactory;

export const userContext = (mashroomUser: any | undefined | null) => {
    let username = null;
    if (mashroomUser) {
        username = mashroomUser.username
    }

    return {
        username
    }
};
