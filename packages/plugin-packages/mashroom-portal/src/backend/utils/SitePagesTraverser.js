// @flow

import {isPagePermitted} from './security_utils';

import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomPortalPageRef, MashroomPortalPageRefLocalized} from '../../../type-definitions';

export default class SitePagesTraverser {

    _pages: Array<MashroomPortalPageRef>;

    constructor(pages: Array<MashroomPortalPageRef>) {
        this._pages = pages;
    }

    findPageByFriendlyUrl(friendlyUrl: string): ?MashroomPortalPageRef {
        if (friendlyUrl.length > 1 && friendlyUrl.endsWith('/')) {
            friendlyUrl = friendlyUrl.substr(0, friendlyUrl.length - 1);
        }
        return this._internalFindPageByFriendlyUrl(this._pages, friendlyUrl);
    }

    async filterAndTranslate(req: ExpressRequest): Promise<?Array<MashroomPortalPageRefLocalized>> {
        return await this._internalFilterAndTranslate(this._pages, req);
    }

    _internalFindPageByFriendlyUrl(pages: ?Array<MashroomPortalPageRef>, friendlyUrl: string) {
        if (!pages) {
            return null;
        }

        for (let i = 0; i < pages.length; i++) {
            const pageRef = pages[i];
            if (pageRef.friendlyUrl === friendlyUrl) {
                return pageRef;
            }

            const subPage = this._internalFindPageByFriendlyUrl(pageRef.subPages, friendlyUrl);
            if (subPage) {
                return subPage;
            }
        }
    }

    async _internalFilterAndTranslate(pages: Array<MashroomPortalPageRef>, req: ExpressRequest) {
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

        const result = [];

        if (pages) {
            for (let i = 0; i < pages.length; i++) {
                const pageRef = pages[i];
                if (await isPagePermitted(req, pageRef.pageId)) {
                    const localizedPage: MashroomPortalPageRefLocalized = {
                        pageId: pageRef.pageId,
                        title: i18nService.translate(req, pageRef.title),
                        friendlyUrl: pageRef.friendlyUrl,
                        hidden: !!pageRef.hidden
                    };

                    if (pageRef.subPages) {
                        localizedPage.subPages = await this._internalFilterAndTranslate(pageRef.subPages, req);
                    }

                    result.push(localizedPage);
                }
            }
        }

        return result;
    }
}
