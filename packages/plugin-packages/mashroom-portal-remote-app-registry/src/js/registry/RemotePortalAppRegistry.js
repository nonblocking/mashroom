// @flow

import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalApp} from '@mashroom/mashroom-portal/type-definitions';
import type {RemotePortalAppRegistry as RemotePortalAppRegistryType, GlobalRequestHolder} from '../../../type-definitions/internal';

const SESSION_KEY_PORTAL_REMOTE_APPS = '__MASHROOM_PORTAL_REMOTE_APPS';

export default class RemotePortalAppRegistry implements RemotePortalAppRegistryType {

    _requestHolder: GlobalRequestHolder;
    _portalApps: Array<MashroomPortalApp>;

    constructor(requestHolder: GlobalRequestHolder) {
        this._requestHolder = requestHolder;
        this._portalApps = [];
    }

    registerRemotePortalApp(portalApp: MashroomPortalApp) {
        this.unregisterRemotePortalApp(portalApp.name);
        this._portalApps.push(portalApp);
    }

    registerRemotePortalAppForSession(portalApp: MashroomPortalApp, request: ExpressRequest) {
        const sessionApps: Array<MashroomPortalApp> = request.session[SESSION_KEY_PORTAL_REMOTE_APPS] || [];
        this._removeApp(sessionApps, portalApp.name);
        sessionApps.push(portalApp);
        request.session[SESSION_KEY_PORTAL_REMOTE_APPS] = sessionApps;
    }

    unregisterRemotePortalApp(name: string) {
        this._removeApp(this._portalApps, name);
    }

    _removeApp(apps: Array<MashroomPortalApp>, name: string) {
        const idx = apps.findIndex((app) => app.name === name);
        if (idx !== -1) {
            apps.splice(idx, 1);
        }
    }

    get portalApps(): Array<MashroomPortalApp> {
        let apps = [];
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

}
