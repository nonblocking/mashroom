// @flow
/* eslint no-console: off */

export const dummyLoggerFactory = () => {
    const dummyLogger = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
        addContext: () => {},
        withContext: () => dummyLogger
    };

    return dummyLogger;
};


export const userContext = (mashroomUser: ?any) => {
    let username = null;
    if (mashroomUser) {
        username = mashroomUser.username
    }

    return {
        username
    }
};
