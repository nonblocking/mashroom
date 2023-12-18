
import MashroomLoggerDelegateLog4js from './log4js/MashroomLoggerDelegateLog4js';

import type {MashroomLoggerDelegate} from '../../../type-definitions/internal';

// For the moment, we use log4js by default
// Change this to make the log framework to use configurable
const DEFAULT_LOGGER_DELEGATE_CLASS = MashroomLoggerDelegateLog4js;

const create = async (serverRootPath: string): Promise<MashroomLoggerDelegate> => {
    const delegate = new DEFAULT_LOGGER_DELEGATE_CLASS();
    await delegate.init(serverRootPath);
    return delegate;
};

export default create;
