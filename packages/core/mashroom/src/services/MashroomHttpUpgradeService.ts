
import requestPluginContext from '../context/request_plugin_context';

import type {Server, Socket} from 'net';
import type{IncomingMessage} from 'http';
import type {MashroomHttpUpgradeHandler, MashroomPluginContextHolder} from '../../type-definitions';
import type {InternalMashroomHttpUpgradeService} from '../../type-definitions/internal';

export default class MashroomHttpUpgradeService implements InternalMashroomHttpUpgradeService {

    private _upgradeHandlers: Array<{
        path: string,
        handler: MashroomHttpUpgradeHandler
    }>;

    constructor(private _pluginContextHolder: MashroomPluginContextHolder) {
        this._upgradeHandlers = [];
    }

    registerUpgradeHandler(handler: MashroomHttpUpgradeHandler, path: string): void {
        const logger = this._pluginContextHolder.getPluginContext().loggerFactory('mashroom.websockets');
        this.unregisterUpgradeHandler(handler);
        logger.info(`Installing HTTP upgrade handler for path: ${path}`);
        this._upgradeHandlers.push({
            path,
            handler,
        })
    }

    unregisterUpgradeHandler(handler: MashroomHttpUpgradeHandler): void {
        this._upgradeHandlers = this._upgradeHandlers.filter((uh) => uh.handler !== handler);
    }

    addServer(server: Server): void {
        server.on('upgrade', this._upgradeHandler.bind(this));
    }

    private _upgradeHandler(req: IncomingMessage, socket: Socket, head: Buffer) {
        const logger = this._pluginContextHolder.getPluginContext().loggerFactory('mashroom.websockets');
        logger.debug('Request for upgrade to:', req.headers.upgrade);


        const path = req.url;
        const entry = path && this._upgradeHandlers.find((ul) => path.startsWith(ul.path));
        if (entry) {
            const reqWithContext: any = {...req, pluginContext: requestPluginContext(req, this._pluginContextHolder),};
            entry.handler(reqWithContext, socket, head);
        } else {
            logger.warn(`No upgrade handler found for path ${path}. Ignoring request.`);
            socket.end(`HTTP/1.1 403 Forbidden\r\n\r\n`, 'ascii');
        }
    }

}
