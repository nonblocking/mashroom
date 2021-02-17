
import {WINDOW_VAR_PORTAL_API_PATH, WINDOW_VAR_PORTAL_SITE_URL} from '../../../backend/constants';

import type {MashroomRestService, MashroomPortalSiteService} from '../../../../type-definitions';

export default class MashroomPortalSiteServiceImpl implements MashroomPortalSiteService {

    private _restService: MashroomRestService;

    constructor(restService: MashroomRestService) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(apiPath);
    }

    getCurrentSiteUrl() {
        const siteId = (global as any)[WINDOW_VAR_PORTAL_SITE_URL];
        if (!siteId) {
            throw new Error('Unable to determine the current site path!');
        }
        return siteId;
    }

    getSites() {
        const path = '/sites';
        return this._restService.get(path);
    }

    getPageTree(siteId: string) {
        const path = `/sites/${siteId}/pageTree`;
        return this._restService.get(path);
    }
}
