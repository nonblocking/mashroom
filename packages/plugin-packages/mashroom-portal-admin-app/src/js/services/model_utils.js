// @flow

import type {MashroomPortalPageRef, MashroomPortalPageRefLocalized} from '@mashroom/mashroom-portal/type-definitions';
import type {AnyPage, FlatPage} from '../../../type-definitions';

type PagePosition = {
    parentPageId: ?string,
    insertAfterPageId: ?string
}

export const flattenPageTree = (pageTree: Array<MashroomPortalPageRefLocalized>): Array<FlatPage> => {
    const pages: Array<FlatPage> = [];

    const iterate = (parent: ?MashroomPortalPageRefLocalized, level: number, pageRefs: Array<MashroomPortalPageRefLocalized>) => {
        for (const pageRef of pageRefs) {
            const page = {
                pageId: pageRef.pageId,
                title: pageRef.title,
                friendlyUrl: pageRef.friendlyUrl,
                level,
                subPages: []
            };
            pages.push(page);
            const subPages = pageRef.subPages;
            if (subPages) {
                page.subPages = subPages.map((sp) => ({
                    pageId: sp.pageId,
                    title: sp.title,
                }));
                iterate(pageRef, level + 1, subPages);
            }
        }
    };

    iterate(null, 0, pageTree);

    return pages;
};

export const searchPageRef = (pageId: string, pages: Array<MashroomPortalPageRef>): ?MashroomPortalPageRef => {
    let pageRef = null;
    const search = (pages: Array<MashroomPortalPageRef>) => {
        pageRef = pages && pages.find((p) => p.pageId === pageId);
        if (!pageRef) {
            pages && pages.forEach((p) => !pageRef && p.subPages && search(p.subPages));
        }
    };

    search(pages);

    return pageRef;
};

export const getParentPage = (pageId: string, pagesFlattened: Array<FlatPage>) => {
    return pagesFlattened.find((p) => p.subPages && p.subPages.find((sp) => sp.pageId === pageId));
};

export const getPagePosition = (pageId: string, pagesFlattened: Array<FlatPage>, rootPages: Array<MashroomPortalPageRefLocalized>): PagePosition => {
    const parentPage = getParentPage(pageId, pagesFlattened);
    const parentPageId = parentPage ? parentPage.pageId : null;
    let insertAfterPageId = null;

    const subPages: ?Array<AnyPage> = parentPage ? parentPage.subPages : rootPages;
    if (subPages) {
        subPages.forEach((sp, idx) => {
            if (sp.pageId === pageId) {
                if (idx > 0) {
                    insertAfterPageId = subPages[idx - 1].pageId;
                }
            }
        });
    }

    return {
        parentPageId,
        insertAfterPageId
    }
};

export const removePageFromTree = (pageId: string, parentPageId: ?string, pages: Array<MashroomPortalPageRef>) => {
    const parent = parentPageId ? searchPageRef(parentPageId, pages) : null;
    const subPages = parent ? parent.subPages : pages;
    if (subPages) {
        const existing = subPages.find((p) => p.pageId === pageId);
        if (existing) {
            const index = subPages.findIndex((p) => p.pageId === pageId);
            subPages.splice(index, 1);
        }
    }
};

export const insertOrUpdatePageAtPosition = (pageRef: MashroomPortalPageRef, pages: Array<MashroomPortalPageRef>, newPosition: PagePosition, currentParentPageId?: ?string): void => {
    if (typeof(currentParentPageId) !== 'undefined') {
        // Remove existing
        removePageFromTree(pageRef.pageId, currentParentPageId, pages);
    }

    const parent: ?MashroomPortalPageRef = newPosition.parentPageId ? searchPageRef(newPosition.parentPageId, pages) : null;
    if (parent && !parent.subPages) {
        parent.subPages = [];
    }
    const subPages = parent ? (parent.subPages || []) : pages;


    const index = newPosition.insertAfterPageId ? subPages.findIndex((p) => p.pageId === newPosition.insertAfterPageId) + 1 : 0;
    subPages.splice(index, 0, pageRef);
};

