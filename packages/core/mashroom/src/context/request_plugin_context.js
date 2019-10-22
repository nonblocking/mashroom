// @flow

import RequestLoggerContext from '../logging/context/RequestLoggerContext';

import type {MashroomPluginContext, MashroomPluginContextHolder} from '../../type-definitions';

const wrapper = (req: http$IncomingMessage<>, pluginContextHolder: MashroomPluginContextHolder): MashroomPluginContext => {
    const pluginContext = pluginContextHolder.getPluginContext();
    return Object.freeze({
        serverInfo: pluginContext.serverInfo,
        serverConfig: pluginContext.serverConfig,
        loggerFactory: pluginContext.loggerFactory.bindToContext(new RequestLoggerContext(req)),
        services: pluginContext.services,
    });
};

export default wrapper;
