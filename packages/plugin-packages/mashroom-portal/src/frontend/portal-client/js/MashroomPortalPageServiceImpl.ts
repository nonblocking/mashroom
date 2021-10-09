
import {WINDOW_VAR_PORTAL_API_PATH, WINDOW_VAR_PORTAL_PAGE_ID} from '../../../backend/constants';

import type {MashroomRestService, MashroomPortalPageService, MashroomPortalPageContent} from '../../../../type-definitions';

export default class MashroomPortalPageServiceImpl implements MashroomPortalPageService {

    private _restService: MashroomRestService;
    private _originalPageId: string;

    constructor(restService: MashroomRestService) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(apiPath);
        this._originalPageId = (global as any)[WINDOW_VAR_PORTAL_PAGE_ID];
    }

    getPageContent(pageId: string): Promise<MashroomPortalPageContent> {
        const path = `/pages/${pageId}/content?originalPageId=${this._originalPageId}`;
        return this._restService.get(path);
    }
}
