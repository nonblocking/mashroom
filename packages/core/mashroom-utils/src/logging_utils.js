// @flow
/* eslint no-console: off */

export const dummyLoggerFactory = () => {
    const dummyLogger = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
        addContext: () => {},
        withContext: () => dummyLogger,
        getContext: () => ({}),
    };

    return dummyLogger;
};

dummyLoggerFactory.bindToContext = () => dummyLoggerFactory;

export const userContext = (mashroomUser: ?any) => {
    let username = null;
    if (mashroomUser) {
        username = mashroomUser.username
    }

    return {
        username
    }
};
