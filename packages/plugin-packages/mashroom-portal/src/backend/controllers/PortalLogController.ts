
import {portalAppContext} from '../utils/logging_utils';

import type {Request, Response} from 'express';
import type {ExpressRequest, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {ClientLogMessage, MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

export default class PortalLogController {

    constructor(private pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async log(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal.client');

        try {
            const body: any = req.body;
            const logMessages: Array<ClientLogMessage> = body;

            if (!logMessages || !Array.isArray(logMessages)) {
                logger.error('Received invalid log messages from client', logMessages);
                return;
            }

            for (const logMessage of logMessages) {
                let sourceAppInfo = '';
                if (logMessage.portalAppName) {
                    const portalApp = this.getPortalApp(logMessage.portalAppName);
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

            res.end();

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    private getPortalApp(pluginName: string) {
        return this.pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
    }

}
