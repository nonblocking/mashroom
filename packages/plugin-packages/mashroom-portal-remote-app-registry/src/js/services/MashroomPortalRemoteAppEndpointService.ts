
import context, {globalRequestHolder} from '../context';

import type {Request} from 'express';
import type {MashroomLogger, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorageService} from '@mashroom/mashroom-storage/type-definitions';
import type {
    MashroomPortalRemoteAppEndpointService as MashroomPortalRemoteAppEndpointServiceType,
    RemotePortalAppEndpoint
} from '../../../type-definitions';

const REMOTE_PORTAL_APP_ENDPOINTS_COLLECTION = 'mashroom-remote-portal-app-endpoints';
const SESSION_KEY_PORTAL_REMOTE_APP_ENDPOINTS = '__MASHROOM_PORTAL_REMOTE_APP_ENDPOINTS';

export default class MashroomPortalRemoteAppEndpointService implements MashroomPortalRemoteAppEndpointServiceType {

    private _logger: MashroomLogger;

    constructor(private _pluginContextHolder: MashroomPluginContextHolder) {
        this._logger = _pluginContextHolder.getPluginContext().loggerFactory('mashroom.portal.remoteAppRegistry');
    }

    async registerRemoteAppUrl(url: string): Promise<void> {
        url = this._fixUrl(url);

        const exists = !! await this.findRemotePortalAppByUrl(url);
        if (!exists) {
            this._logger.info(`Adding remote portal app URL: ${url}`);
            const collection = await this._getRemotePortalAppEndpointsCollection();
            await collection.insertOne({
                url,
                sessionOnly: false,
                lastError: null,
                retries: 0,
                registrationTimestamp: null,
                portalApps: [],
                invalidPortalApps: [],
            });

            context.backgroundJob.run();
        }
    }

    async synchronousRegisterRemoteAppUrlInSession(url: string, request: Request): Promise<void> {
        url = this._fixUrl(url);
        const portalAppEndpoints: Array<RemotePortalAppEndpoint> = request.session[SESSION_KEY_PORTAL_REMOTE_APP_ENDPOINTS] || [];

        if (portalAppEndpoints.find((endpoint) => endpoint.url === url)) {
            return;
        }

        this._logger.info(`Adding remote portal app URL for current session: ${url}`);

        const portalAppEndpoint = {
            url,
            sessionOnly: true,
            lastError: null,
            retries: 0,
            registrationTimestamp: null,
            portalApps: [],
            invalidPortalApps: [],
        };

        const updatedEndpoint = await context.backgroundJob.fetchPortalAppDataAndUpdateEndpoint(portalAppEndpoint);
        portalAppEndpoints.push(updatedEndpoint);

        // eslint-disable-next-line require-atomic-updates
        request.session[SESSION_KEY_PORTAL_REMOTE_APP_ENDPOINTS] = portalAppEndpoints;

        updatedEndpoint.portalApps.forEach((portalApp) => context.registry.registerRemotePortalAppForSession(portalApp, request));
    }

    async unregisterRemoteAppUrl(url: string): Promise<void> {
        const request = globalRequestHolder.request;
        if (request) {
            const sessionEndpoints: Array<RemotePortalAppEndpoint> = request.session[SESSION_KEY_PORTAL_REMOTE_APP_ENDPOINTS] || [];
            const newSessionEndpoints = sessionEndpoints.filter((endpoint) => endpoint.url !== url);
            if (sessionEndpoints.length !== newSessionEndpoints.length) {
                request.session[SESSION_KEY_PORTAL_REMOTE_APP_ENDPOINTS] = newSessionEndpoints;
                return;
            }
        }

        const collection = await this._getRemotePortalAppEndpointsCollection();
        const existingEndpoint = await collection.findOne({ url });
        if (existingEndpoint) {
            existingEndpoint.portalApps.forEach((portalApp) => context.registry.unregisterRemotePortalApp(portalApp.name));
            await collection.deleteOne({ url });
        }
    }

    async findRemotePortalAppByUrl(url: string): Promise<RemotePortalAppEndpoint | null | undefined> {
        const collection = await this._getRemotePortalAppEndpointsCollection();
        return await collection.findOne({ url });
    }

    async findAll(): Promise<Readonly<Array<RemotePortalAppEndpoint>>> {
        const request = globalRequestHolder.request;
        let sessionEndpoints: Array<RemotePortalAppEndpoint> = [];
        if (request) {
            sessionEndpoints = request.session[SESSION_KEY_PORTAL_REMOTE_APP_ENDPOINTS] || [];
        }

        const collection = await this._getRemotePortalAppEndpointsCollection();
        const {result} = await collection.find();

        return Object.freeze([...sessionEndpoints, ...result]);
    }

    async updateRemotePortalAppEndpoint(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<void> {
        const collection = await this._getRemotePortalAppEndpointsCollection();
        const existingEndpoint = await collection.findOne({ url: remotePortalAppEndpoint.url });
        if (existingEndpoint) {
            await collection.updateOne({ url: remotePortalAppEndpoint.url }, remotePortalAppEndpoint);
        } else {
            this._logger.error(`Cannot update remote portal app endpoint because it doesn't exist: ${remotePortalAppEndpoint.url}`);
        }
    }

    async refreshEndpointRegistration(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<void> {
        await context.backgroundJob.refreshEndpointRegistration(remotePortalAppEndpoint);
    }

    private async _getRemotePortalAppEndpointsCollection(): Promise<MashroomStorageCollection<RemotePortalAppEndpoint>> {
        return this._getStorageService().getCollection(REMOTE_PORTAL_APP_ENDPOINTS_COLLECTION);
    }

    private _getStorageService(): MashroomStorageService {
        return this._pluginContextHolder.getPluginContext().services.storage.service;
    }

    private _fixUrl(url: string): string {
        if (url.endsWith('/')) {
            return url.substr(0, url.length - 1);
        }
        return url;
    }
}
