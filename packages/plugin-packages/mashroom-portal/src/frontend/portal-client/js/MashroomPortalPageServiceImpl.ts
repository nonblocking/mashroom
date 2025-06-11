
import {
    WINDOW_VAR_PORTAL_API_PATH,
    WINDOW_VAR_PORTAL_PAGE_ID,
    WINDOW_VAR_PORTAL_SITE_ID,
    WINDOW_VAR_PORTAL_SITE_URL
} from '../../../backend/constants';

import type {MashroomPortalPageService, MashroomPortalPageContent, MashroomPortalPageRefLocalized} from '../../../../type-definitions';
import type {MashroomRestService} from '../../../../type-definitions/internal';

export default class MashroomPortalPageServiceImpl implements MashroomPortalPageService {

    private _restService: MashroomRestService;
    private _originalPageId: string;
    private _pageTree: Array<MashroomPortalPageRefLocalized> | undefined;

    constructor(restService: MashroomRestService) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(apiPath);
        this._originalPageId = this.getCurrentPageId();
    }

    getCurrentPageId(): string {
        const pageId = (global as any)[WINDOW_VAR_PORTAL_PAGE_ID];
        if (!pageId) {
            throw new Error('Unable to determine the current pageId!');
        }
        return pageId;
    }

    getPageFriendlyUrl(pageUrl: string): string {
        let friendlyUrl = pageUrl.split(/\\?#/)[0];
        const siteUrl = (global as any)[WINDOW_VAR_PORTAL_SITE_URL] || '';
        if (siteUrl && pageUrl.indexOf(siteUrl) === 0) {
            friendlyUrl = friendlyUrl.substr(siteUrl.length);
        }
        // Remove trailing slash
        if (friendlyUrl.lastIndexOf('/') === friendlyUrl.length -1) {
            friendlyUrl = friendlyUrl.substr(0, friendlyUrl.length - 1);
        }
        if (!friendlyUrl) {
            friendlyUrl = '/';
        }
        return friendlyUrl;
    }

    async getPageId(pageUrl: string): Promise<string | undefined> {
        const friendlyUrl = this.getPageFriendlyUrl(pageUrl);
        if (this._pageTree) {
            return Promise.resolve(this._findPageIdInTree(friendlyUrl, this._pageTree));
        }

        try {
            this._pageTree = await this._getPageTree();
            return this._findPageIdInTree(friendlyUrl, this._pageTree);
        } catch (e) {
            console.error('Loading page tree failed', e);
            return undefined;
        }
    }

    getPageContent(pageId: string): Promise<MashroomPortalPageContent> {
        const path = `/pages/${pageId}/content?originalPageId=${this._originalPageId}`;
        return this._restService.get(path);
    }

    private _findPageIdInTree(friendlyUrl: string, tree: Array<MashroomPortalPageRefLocalized> | undefined | null): string | undefined {
        if (!tree) {
            return;
        }
        for (let i = 0; i < tree.length; i++) {
            const page = tree[i];
            if (page.friendlyUrl === friendlyUrl) {
                return page.pageId;
            }
            const subPageIdMatch = this._findPageIdInTree(friendlyUrl, page.subPages);
            if (subPageIdMatch) {
                return subPageIdMatch;
            }
        }
    }

    private _getPageTree(): Promise<Array<MashroomPortalPageRefLocalized>> {
        const siteId = this._getSiteId();
        const path = `/sites/${siteId}/pageTree`;
        return this._restService.get(path);
    }

    private _getSiteId(): string {
        const siteId = (global as any)[WINDOW_VAR_PORTAL_SITE_ID];
        if (!siteId) {
            throw new Error('Unable to determine the current site ID!');
        }
        return siteId;
    }
}
