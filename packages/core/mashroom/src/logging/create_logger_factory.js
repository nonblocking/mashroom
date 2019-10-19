// @flow

import MashroomLoggerDelegateLog4js from './MashroomLoggerDelegateLog4js';
import MashroomLogger from './MashroomLogger';

import type {MashroomLoggerDelegate, MashroomLoggerFactory} from '../../type-definitions';

// For the moment, we use log4js by default
// Change this to make the log framework to use configurable
const DEFAULT_LOGGER_DELEGATE_CLASS = MashroomLoggerDelegateLog4js;

const loggerFactory = async (serverRootPath: string, overrideLoggerDelegate?: MashroomLoggerDelegate): Promise<MashroomLoggerFactory> => {
    const loggerDelegate = overrideLoggerDelegate || new DEFAULT_LOGGER_DELEGATE_CLASS();
    await loggerDelegate.init(serverRootPath);

    return (category: string) => {
        return new MashroomLogger(category, null, loggerDelegate);
    };
};

export default loggerFactory;
