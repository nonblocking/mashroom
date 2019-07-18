// @flow

import {userAndAgentContext} from '@mashroom/mashroom-utils/lib/logging_utils';
import {portalAppContext} from '../utils/logging_utils';

import type {ExpressRequest, ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {ClientLogMessage, MashroomPortalPluginRegistry} from '../../../type-definitions';


export default class PortalLogController {

    pluginRegistry: MashroomPortalPluginRegistry;

    constructor(pluginRegistry: MashroomPortalPluginRegistry) {
        this.pluginRegistry = pluginRegistry;
    }

    async log(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal.client');
        let contextLogger = logger.withContext(userAndAgentContext(req));

        const body: any = req.body;
        const logMessages: Array<ClientLogMessage> = body;

        if (!logMessages || !Array.isArray(logMessages)) {
            logger.error('Received invalid log messages from client', logMessages);
            return;
        }

        for (const logMessage of logMessages) {
            let sourceAppInfo = '';
            if (logMessage.portalAppName) {
                const portalApp = this._getPortalApp(logMessage.portalAppName);
                if (portalApp) {
                    contextLogger = contextLogger.withContext(portalAppContext(portalApp));
                    sourceAppInfo = `Caused by portal app: ${portalApp.name} v${portalApp.version}`;
                }
            }

            switch (logMessage.level) {
                case 'error':
                    contextLogger.error(logMessage.message, sourceAppInfo);
                    break;
                case 'warn':
                    contextLogger.warn(logMessage.message, sourceAppInfo);
                    break;
                case 'info':
                    contextLogger.info(logMessage.message, sourceAppInfo);
                    break;
                default:
                case 'debug':
                    contextLogger.debug(logMessage.message, sourceAppInfo);
                    break;
            }
        }
    }

    _getPortalApp(pluginName: string) {
        return this.pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
    }

}
