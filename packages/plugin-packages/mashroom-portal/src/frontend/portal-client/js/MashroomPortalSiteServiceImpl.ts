
import {WINDOW_VAR_PORTAL_API_PATH, WINDOW_VAR_PORTAL_SITE_URL} from '../../../backend/constants';

import type {MashroomRestService, MashroomPortalSiteService, MashroomPortalPageRefLocalized, MashroomPortalSiteLinkLocalized} from '../../../../type-definitions';

export default class MashroomPortalSiteServiceImpl implements MashroomPortalSiteService {

    private _restService: MashroomRestService;

    constructor(restService: MashroomRestService) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(apiPath);
    }

    getCurrentSiteUrl(): string {
        const siteId = (global as any)[WINDOW_VAR_PORTAL_SITE_URL];
        if (!siteId) {
            throw new Error('Unable to determine the current site path!');
        }
        return siteId;
    }

    getSites(): Promise<Array<MashroomPortalSiteLinkLocalized>> {
        const path = '/sites';
        return this._restService.get(path);
    }

    getPageTree(siteId: string): Promise<Array<MashroomPortalPageRefLocalized>> {
        const path = `/sites/${siteId}/pageTree`;
        return this._restService.get(path);
    }
}
