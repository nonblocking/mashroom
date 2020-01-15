// @flow

import type {
    MashroomPluginContextHolder as MashroomPluginContextHolderType,
    MashroomPluginContext
} from '../../type-definitions';
import type {
    MashroomServerContextHolder,
} from '../../type-definitions/internal';

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
