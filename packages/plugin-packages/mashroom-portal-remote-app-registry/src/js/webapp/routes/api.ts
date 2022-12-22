
import type {Request, Response} from 'express';
import type {
    MashroomPortalRemoteAppEndpointService,
} from '../../../../type-definitions';
import type {
    RemotePortalAppEndpointAddRequest
} from '../../../../type-definitions/internal';

export const getRemotePortalApps = async (req: Request, res: Response): Promise<void> => {
    const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = req.pluginContext.services.remotePortalAppEndpoint!.service;

    const remotePortalApps = await portalRemoteAppEndpointService.findAll();

    res.json(remotePortalApps);
};

export const addRemotePortalAppUrl = async (req: Request, res: Response): Promise<void> => {
    const logger = req.pluginContext.loggerFactory('mashroom.portal.remoteAppRegistry');
    const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = req.pluginContext.services.remotePortalAppEndpoint!.service;

    const addRequest: RemotePortalAppEndpointAddRequest = req.body;
    if (!addRequest || !addRequest.url) {
        res.sendStatus(400);
        return;
    }

    try {
        if (addRequest.sessionOnly) {
            logger.info(`Adding portal app endpoint for session: ${addRequest.url}`);
            await portalRemoteAppEndpointService.synchronousRegisterRemoteAppUrlInSession(addRequest.url, req);
        } else {
            logger.info(`Adding portal app endpoint: ${addRequest.url}`);
            await portalRemoteAppEndpointService.registerRemoteAppUrl(addRequest.url);
        }

        res.end();

    } catch (error) {
        logger.error('Adding endpoint failed', error);
        res.sendStatus(500);
    }
};

export const deleteRemotePortalAppUrl = async (req: Request, res: Response): Promise<void> => {
    const logger = req.pluginContext.loggerFactory('mashroom.portal.remoteAppRegistry');
    const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = req.pluginContext.services.remotePortalAppEndpoint!.service;

    const url = req.params.url;
    if (!url) {
        res.sendStatus(400);
        return;
    }

    logger.info(`Removing portal app endpoint: ${url}`);
    await portalRemoteAppEndpointService.unregisterRemoteAppUrl(url);

    res.end();
};
