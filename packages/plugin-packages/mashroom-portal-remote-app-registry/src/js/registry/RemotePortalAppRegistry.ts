
import type {Request} from 'express';
import type {MashroomPortalApp} from '@mashroom/mashroom-portal/type-definitions';
import type {RemotePortalAppRegistry as RemotePortalAppRegistryType, GlobalRequestHolder} from '../../../type-definitions/internal';

const SESSION_KEY_PORTAL_REMOTE_APPS = '__MASHROOM_PORTAL_REMOTE_APPS';

export default class RemotePortalAppRegistry implements RemotePortalAppRegistryType {

    private _portalApps: Array<MashroomPortalApp>;

    constructor(private _requestHolder: GlobalRequestHolder) {
        this._portalApps = [];
    }

    registerRemotePortalApp(portalApp: MashroomPortalApp): void {
        this.unregisterRemotePortalApp(portalApp.name);
        this._portalApps.push(portalApp);
    }

    registerRemotePortalAppForSession(portalApp: MashroomPortalApp, request: Request): void {
        const sessionApps: Array<MashroomPortalApp> = request.session[SESSION_KEY_PORTAL_REMOTE_APPS] || [];
        this._removeApp(sessionApps, portalApp.name);
        sessionApps.push(portalApp);
        request.session[SESSION_KEY_PORTAL_REMOTE_APPS] = sessionApps;
    }

    unregisterRemotePortalApp(name: string): void {
        this._removeApp(this._portalApps, name);
    }

    unregisterRemotePortalAppForSession(name: string, request: Request): void {
        const sessionApps: Array<MashroomPortalApp> = request.session[SESSION_KEY_PORTAL_REMOTE_APPS] || [];
        const newSessionApps = sessionApps.filter((portalApp) => portalApp.name !== name);
        request.session[SESSION_KEY_PORTAL_REMOTE_APPS] = newSessionApps;
    }

    get portalApps(): Readonly<Array<MashroomPortalApp>> {
        let apps: Array<MashroomPortalApp> = [];
        const request = this._requestHolder.request;
        if (request) {
            const sessionApps = request.session[SESSION_KEY_PORTAL_REMOTE_APPS] || [];
            apps = [...sessionApps];
        }
        for (const app of this._portalApps) {
            if (apps.findIndex((a) => a.name === app.name) === -1) {
                apps.push(app);
            }
        }

        return Object.freeze(apps);
    }

    private _removeApp(apps: Array<MashroomPortalApp>, name: string): void{
        const idx = apps.findIndex((app) => app.name === name);
        if (idx !== -1) {
            apps.splice(idx, 1);
        }
    }

}
