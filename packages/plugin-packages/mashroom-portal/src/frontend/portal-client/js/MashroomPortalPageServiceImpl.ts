
import {WINDOW_VAR_PORTAL_API_PATH, WINDOW_VAR_PORTAL_PAGE_ID} from '../../../backend/constants';

import type {MashroomRestService, MashroomPortalPageService, MashroomPortalPageContent} from '../../../../type-definitions';

export default class MashroomPortalPageServiceImpl implements MashroomPortalPageService {

    private _restService: MashroomRestService;

    constructor(restService: MashroomRestService) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(apiPath);
    }

    getPageContent(pageId: string): Promise<MashroomPortalPageContent> {
        const currentPageId = (global as any)[WINDOW_VAR_PORTAL_PAGE_ID];
        const path = `/pages/${pageId}/content?currentPageId=${currentPageId}`;
        return this._restService.get(path);
    }
}
