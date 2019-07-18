// @flow

import MashroomLoggerFactory from './MashroomLoggerFactory';
import MashroomLoggerDelegateLog4js from './MashroomLoggerDelegateLog4js';

const LOGGER_DELEGATE = new MashroomLoggerDelegateLog4js();

const loggerFactoryFactory = async (serverRootPath: string) => {
    const loggerClusterSingleton = new MashroomLoggerFactory(LOGGER_DELEGATE);
    return await loggerClusterSingleton.factory(serverRootPath);
};

export default loggerFactoryFactory;
