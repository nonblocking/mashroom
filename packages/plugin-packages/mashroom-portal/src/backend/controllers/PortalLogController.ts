
import {portalAppContext} from '../utils/logging-utils';

import type {Request, Response} from 'express';

import type {ClientLogMessage, MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

export default class PortalLogController {

    constructor(private _pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async log(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal.client');

        try {
            const body: any = req.body;
            const logMessages: Array<ClientLogMessage> = body;

            if (!logMessages || !Array.isArray(logMessages)) {
                logger.error('Received invalid log messages from client', logMessages);
                res.sendStatus(400);
                return;
            }

            for (const logMessage of logMessages) {
                let sourceAppInfo = `[Path: ${logMessage.path}]`;
                logger.addContext({
                    portalPath: logMessage.path,
                });
                if (logMessage.portalAppName) {
                    const portalApp = this._getPortalApp(logMessage.portalAppName);
                    if (portalApp) {
                        logger.addContext(portalAppContext(portalApp));
                        sourceAppInfo += ` [App: ${portalApp.name} v${portalApp.version}]`;
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

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    private _getPortalApp(pluginName: string) {
        return this._pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
    }

}
