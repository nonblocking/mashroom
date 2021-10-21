
import {WINDOW_VAR_PORTAL_API_PATH, WINDOW_VAR_PORTAL_SITE_URL} from '../../../backend/constants';

import type {MashroomPortalSiteService, MashroomPortalPageRefLocalized, MashroomPortalSiteLinkLocalized} from '../../../../type-definitions';
import type {MashroomRestService} from '../../../../type-definitions/internal';

export default class MashroomPortalSiteServiceImpl implements MashroomPortalSiteService {

    private _restService: MashroomRestService;

    constructor(restService: MashroomRestService) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(apiPath);
    }

    getCurrentSiteUrl(): string {
        const siteUrl = (global as any)[WINDOW_VAR_PORTAL_SITE_URL];
        if (!siteUrl) {
            throw new Error('Unable to determine the current site path!');
        }
        return siteUrl;
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
