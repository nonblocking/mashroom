
import requestPluginContext from '../context/request_plugin_context';

import type {Server, Socket} from 'net';
import type{IncomingMessage} from 'http';
import type {
    IncomingMessageWithContext,
    MashroomHttpUpgradeHandler,
    MashroomPluginContextHolder
} from '../../type-definitions';
import type {InternalMashroomHttpUpgradeService} from '../../type-definitions/internal';

export default class MashroomHttpUpgradeService implements InternalMashroomHttpUpgradeService {

    private _upgradeHandlers: Array<{
        pathExpression: string | RegExp,
        handler: MashroomHttpUpgradeHandler
    }>;

    constructor(private _pluginContextHolder: MashroomPluginContextHolder) {
        this._upgradeHandlers = [];
    }

    registerUpgradeHandler(handler: MashroomHttpUpgradeHandler, pathExpression: string | RegExp): void {
        const logger = this._pluginContextHolder.getPluginContext().loggerFactory('mashroom.upgrade.service');
        this.unregisterUpgradeHandler(handler);
        logger.info(`Installing HTTP upgrade handler for path expression: ${pathExpression}`);
        this._upgradeHandlers.push({
            pathExpression,
            handler,
        });
    }

    unregisterUpgradeHandler(handler: MashroomHttpUpgradeHandler): void {
        this._upgradeHandlers = this._upgradeHandlers.filter((uh) => uh.handler !== handler);
    }

    addServer(server: Server): void {
        server.on('upgrade', this._upgradeHandler.bind(this));
    }

    private _upgradeHandler(req: IncomingMessage, socket: Socket, head: Buffer) {
        const logger = this._pluginContextHolder.getPluginContext().loggerFactory('mashroom.upgrade.service');
        logger.debug('Request for upgrade to:', req.headers.upgrade);


        const path = req.url;
        const entry = path && this._upgradeHandlers.find((ul) => path.match(ul.pathExpression));
        if (entry) {
            const reqWithContext = req as IncomingMessageWithContext;
            reqWithContext.pluginContext = requestPluginContext(req, this._pluginContextHolder);
            entry.handler(reqWithContext, socket, head);
        } else {
            logger.warn(`No upgrade handler found for path ${path}. Ignoring request.`);
            socket.end(`HTTP/1.1 403 Forbidden\r\n\r\n`, 'ascii');
        }
    }

}
