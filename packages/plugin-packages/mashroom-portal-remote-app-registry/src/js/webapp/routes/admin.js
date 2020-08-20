// @flow

import context from '../../context';
import {jsonToHtml} from '@mashroom/mashroom-utils/lib/html_utils';

import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';
import type {MashroomCSRFService} from '@mashroom/mashroom-csrf-protection/type-definitions';
import type {MashroomPortalRemoteAppEndpointService, RemotePortalAppEndpoint} from '../../../../type-definitions';

const renderAdminPage = async (req: ExpressRequest, res: ExpressResponse, errorMessage?: string) => {
    const csrfService: MashroomCSRFService = req.pluginContext.services.csrf && req.pluginContext.services.csrf.service;
    const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = req.pluginContext.services.remotePortalAppEndpoint.service;
    const remoteAppEndpoints: Array<RemotePortalAppEndpoint> = await portalRemoteAppEndpointService.findAll();

    const endpoints = remoteAppEndpoints.map((endpoint) => ({
        url: endpoint.url,
        sessionOnly: endpoint.sessionOnly ? 'Yes' : '',
        status: status(endpoint),
        statusClass: endpoint.lastError ? 'error' : (endpoint.registrationTimestamp ? 'registered' : 'pending'),
        rowClass: endpoint.lastError ? 'row-error' : '',
        portalApps: endpoint.portalApps.map((app) => ({
            name: app.name,
            version: app.version,
            pluginDef: jsonToHtml(app),
        }))
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
        return `Registered at ${new Date(endpoint.registrationTimestamp).toLocaleString()}`;
    }
    return 'Pending...';
};

export const adminIndex = async (req: ExpressRequest, res: ExpressResponse) => {
    await renderAdminPage(req, res);
};

export const adminUpdate = async (req: ExpressRequest, res: ExpressResponse) => {
    const logger = req.pluginContext.loggerFactory('mashroom.portal.remoteAppRegistry');
    const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = req.pluginContext.services.remotePortalAppEndpoint.service;

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
            } catch (error) {
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

