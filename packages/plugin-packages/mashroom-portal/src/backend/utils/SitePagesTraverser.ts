
import {isPagePermitted} from './security_utils';

import type {Request} from 'express';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomPortalPageRef, MashroomPortalPageRefLocalized} from '../../../type-definitions';

export default class SitePagesTraverser {

    constructor(private _pages: Array<MashroomPortalPageRef>) {
    }

    findPageByFriendlyUrl(friendlyUrl: string): MashroomPortalPageRef | undefined | null {
        if (friendlyUrl.length > 1 && friendlyUrl.endsWith('/')) {
            friendlyUrl = friendlyUrl.substr(0, friendlyUrl.length - 1);
        }
        return this._internalFindPageByFriendlyUrl(this._pages, friendlyUrl);
    }

    async filterAndTranslate(req: Request): Promise<Array<MashroomPortalPageRefLocalized> | undefined | null> {
        return await this._internalFilterAndTranslate(this._pages, req);
    }

    private _internalFindPageByFriendlyUrl(pages: Array<MashroomPortalPageRef> | undefined | null, friendlyUrl: string): MashroomPortalPageRef | undefined | null {
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

    private async _internalFilterAndTranslate(pages: Array<MashroomPortalPageRef>, req: Request): Promise<Array<MashroomPortalPageRefLocalized> | undefined | null> {
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
                        localizedPage.subPages = await this._internalFilterAndTranslate(pageRef.subPages, req) || undefined;
                    }

                    result.push(localizedPage);
                }
            }
        }

        return result;
    }
}
