// @flow

import {portalAppContext} from '../utils/logging_utils';

import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger
} from '@mashroom/mashroom/type-definitions';
import type {ClientLogMessage, MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

export default class PortalLogController {

    _pluginRegistry: MashroomPortalPluginRegistry;

    constructor(pluginRegistry: MashroomPortalPluginRegistry) {
        this._pluginRegistry = pluginRegistry;
    }

    async log(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.portal.client');

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
                    logger.addContext(portalAppContext(portalApp));
                    sourceAppInfo = `Caused by portal app: ${portalApp.name} v${portalApp.version}`;
                }
            }

            switch (logMessage.level) {
                case 'error':
                    logger.error(logMessage.message, sourceAppInfo);
                    break;
                case 'warn':
                    logger.warn(logMessage.message, sourceAppInfo);
                    break;
                case 'info':
                    logger.info(logMessage.message, sourceAppInfo);
                    break;
                default:
                case 'debug':
                    logger.debug(logMessage.message, sourceAppInfo);
                    break;
            }
        }
    }

    _getPortalApp(pluginName: string) {
        return this._pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
    }

}
