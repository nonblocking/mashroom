
import RequestLoggerContext from '../logging/context/RequestLoggerContext';

import type {IncomingMessage} from 'http';
import type {MashroomPluginContext, MashroomPluginContextHolder} from '../../type-definitions';

const wrapper = (req: IncomingMessage, pluginContextHolder: MashroomPluginContextHolder): MashroomPluginContext => {
    const pluginContext = pluginContextHolder.getPluginContext();
    return Object.freeze({
        serverInfo: pluginContext.serverInfo,
        serverConfig: pluginContext.serverConfig,
        loggerFactory: pluginContext.loggerFactory.bindToContext(new RequestLoggerContext(req)),
        services: pluginContext.services,
    });
};

export default wrapper;
