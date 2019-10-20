// @flow

import type {
    MashroomPluginContextHolder as MashroomPluginContextHolderType,
    MashroomServerContextHolder,
    MashroomPluginContext
} from '../../type-definitions';

export default class MashroomPluginContextHolder implements MashroomPluginContextHolderType {

    _createFromServerContext: () => MashroomPluginContext;

    constructor(serverContextHolder: MashroomServerContextHolder) {
        this._createFromServerContext = () => {
            const serverContext = serverContextHolder.getServerContext();
            return {
                serverInfo: serverContext.serverInfo,
                serverConfig: serverContext.serverConfigHolder.getConfig(),
                loggerFactory: serverContext.loggerFactory,
                services: serverContext.serviceRegistry.getServiceNamespaces(),
            };
        };
    }

    getPluginContext() {
        return Object.freeze(this._createFromServerContext());
    }

}
