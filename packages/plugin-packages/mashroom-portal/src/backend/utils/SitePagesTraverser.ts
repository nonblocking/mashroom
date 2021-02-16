
import {isPagePermitted} from './security_utils';

import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomPortalPageRef, MashroomPortalPageRefLocalized} from '../../../type-definitions';

export default class SitePagesTraverser {

    constructor(private pages: Array<MashroomPortalPageRef>) {
    }

    findPageByFriendlyUrl(friendlyUrl: string): MashroomPortalPageRef | undefined | null {
        if (friendlyUrl.length > 1 && friendlyUrl.endsWith('/')) {
            friendlyUrl = friendlyUrl.substr(0, friendlyUrl.length - 1);
        }
        return this.internalFindPageByFriendlyUrl(this.pages, friendlyUrl);
    }

    async filterAndTranslate(req: ExpressRequest): Promise<Array<MashroomPortalPageRefLocalized> | undefined | null> {
        return await this.internalFilterAndTranslate(this.pages, req);
    }

    private internalFindPageByFriendlyUrl(pages: Array<MashroomPortalPageRef> | undefined | null, friendlyUrl: string): MashroomPortalPageRef | undefined | null {
        if (!pages) {
            return null;
        }

        for (let i = 0; i < pages.length; i++) {
            const pageRef = pages[i];
            if (pageRef.friendlyUrl === friendlyUrl) {
                return pageRef;
            }

            const subPage = this.internalFindPageByFriendlyUrl(pageRef.subPages, friendlyUrl);
            if (subPage) {
                return subPage;
            }
        }
    }

    private async internalFilterAndTranslate(pages: Array<MashroomPortalPageRef>, req: ExpressRequest): Promise<Array<MashroomPortalPageRefLocalized> | undefined | null> {
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
                        localizedPage.subPages = await this.internalFilterAndTranslate(pageRef.subPages, req) || undefined;
                    }

                    result.push(localizedPage);
                }
            }
        }

        return result;
    }
}
