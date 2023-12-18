
import {htmlUtils} from '@mashroom/mashroom-utils';
import context from '../../context';

import type {Request, Response} from 'express';
import type {MashroomCSRFService} from '@mashroom/mashroom-csrf-protection/type-definitions';
import type {MashroomPortalRemoteAppEndpointService, RemotePortalAppEndpoint} from '../../../../type-definitions';

const formatDate = (ts: number): string => {
    return new Date(ts).toISOString().replace(/T/, ' ').replace(/\..+/, '');
};

const getStatusWeight = (e: RemotePortalAppEndpoint): number => {
    if (e.lastError) {
        return 2;
    }
    if (!e.registrationTimestamp) {
        return 1;
    }
    return 0;
};

const renderAdminPage = async (req: Request, res: Response, errorMessage?: string) => {
    const csrfService: MashroomCSRFService = req.pluginContext.services.csrf?.service;
    const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = req.pluginContext.services.remotePortalAppEndpoint!.service;
    const remoteAppEndpoints = await portalRemoteAppEndpointService.findAll();

    const endpoints = [...remoteAppEndpoints]
        .sort((e1, e2) => {
            const status1 = getStatusWeight(e1);
            const status2 = getStatusWeight(e2);
            if (status1 == status2) {
                return e1.url.localeCompare(e2.url);
            }
            return status2 - status1;
        })
        .map((endpoint) => ({
            url: endpoint.url,
            sessionOnly: endpoint.sessionOnly ? 'Yes' : '',
            status: status(endpoint),
            statusClass: endpoint.lastError ? 'error' : (endpoint.registrationTimestamp ? 'registered' : 'pending'),
            rowClass: endpoint.lastError ? 'row-error' : '',
            portalApps: endpoint.portalApps.map((app) => ({
                name: app.name,
                version: app.version,
                pluginDef: htmlUtils.jsonToHtml(app),
            })),
            invalidPortalApps: endpoint.invalidPortalApps ?? [],
        }));

    res.render('admin', {
        baseUrl: req.baseUrl,
        showAddRemoteAppForm: context.webUIShowAddRemoteAppForm,
        endpoints,
        errorMessage,
        csrfToken: csrfService ? csrfService.getCSRFToken(req) : null
    });
};

const status = (endpoint: RemotePortalAppEndpoint) => {
    if (endpoint.lastError) {
        return `Error: ${endpoint.lastError}`;
    }
    if (endpoint.registrationTimestamp) {
        return `Registered at ${formatDate(endpoint.registrationTimestamp)}`;
    }
    return 'Pending...';
};

export const adminIndex = async (req: Request, res: Response) => {
    await renderAdminPage(req, res);
};

export const adminUpdate = async (req: Request, res: Response) => {
    const logger = req.pluginContext.loggerFactory('mashroom.portal.remoteAppRegistry');
    const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = req.pluginContext.services.remotePortalAppEndpoint!.service;

    const action = req.body._action || 'add';
    const url = req.body._url;
    const sessionOnly = !!req.body._sessionOnly;

    if (action === 'add') {
        if (!url || url === '') {
            const errorMessage = 'Error: Invalid URL';
            await renderAdminPage(req, res, errorMessage);
            return;
        } else {
            try {
                if (sessionOnly) {
                    logger.info(`Adding portal app endpoint for session: ${url}`);
                    await portalRemoteAppEndpointService.synchronousRegisterRemoteAppUrlInSession(url, req);
                } else {
                    logger.info(`Adding portal app endpoint: ${url}`);
                    await portalRemoteAppEndpointService.registerRemoteAppUrl(url);
                }
            } catch (error: any) {
                logger.error('Adding endpoint failed', error);
                const errorMessage = `Error: Adding endpoint failed: ${error.message}`;
                await renderAdminPage(req, res, errorMessage);
                return;
            }
        }
    } else if (action === 'refresh') {
        if (url) {
            logger.info(`Refreshing portal app endpoint: ${url}`);
            const endpoint = await portalRemoteAppEndpointService.findRemotePortalAppByUrl(url);
            if (endpoint) {
                await portalRemoteAppEndpointService.refreshEndpointRegistration(endpoint);
            }
        }
    } else if (action === 'delete') {
        if (url) {
            logger.info(`Removing portal app endpoint: ${url}`);
            await portalRemoteAppEndpointService.unregisterRemoteAppUrl(url);
        }
    }

    res.redirect(req.baseUrl);
};

