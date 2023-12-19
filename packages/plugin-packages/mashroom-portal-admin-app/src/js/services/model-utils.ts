
import type {MashroomPortalPageRef, MashroomPortalPageRefLocalized} from '@mashroom/mashroom-portal/type-definitions';
import type {FlatPage, PagePosition, Writable} from '../types';

export const flattenPageTree = (pageTree: Array<MashroomPortalPageRefLocalized>): Array<FlatPage> => {
    const pages: Array<FlatPage> = [];

    const iterate = (parent: MashroomPortalPageRefLocalized | undefined | null, level: number, pageRefs: Array<MashroomPortalPageRefLocalized>) => {
        for (const pageRef of pageRefs) {
            const page: FlatPage = {
                pageId: pageRef.pageId,
                title: pageRef.title,
                friendlyUrl: pageRef.friendlyUrl,
                clientSideRouting: pageRef.clientSideRouting,
                level,
                subPages: []
            };
            pages.push(page);
            const subPages = pageRef.subPages;
            if (subPages) {
                subPages.forEach((sp) => {
                    page.subPages!.push({
                        pageId: sp.pageId,
                        title: sp.title,
                    });
                });
                iterate(pageRef, level + 1, subPages);
            }
        }
    };

    iterate(null, 0, pageTree);

    return pages;
};

export const searchPageRef = (pageId: string, pages: Array<MashroomPortalPageRef>): MashroomPortalPageRef | undefined | null => {
    let pageRef: MashroomPortalPageRef | null | undefined = null;
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

    const subPages = parentPage ? parentPage.subPages : rootPages;
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
    };
};

export const removePageFromTree = (pageId: string, parentPageId: string | undefined | null, pages: Array<MashroomPortalPageRef>, moveSubPagesUp = false) => {
    const parent = parentPageId ? searchPageRef(parentPageId, pages) : null;
    const subPages = parent ? parent.subPages : pages;
    if (subPages) {
        const existing = subPages.find((p) => p.pageId === pageId);
        if (existing) {
            const index = subPages.findIndex((p) => p.pageId === pageId);
            subPages.splice(index, 1);
            if (moveSubPagesUp) {
                subPages.splice(index, 0, ...existing.subPages ?? []);
            }
        }
    }
};

export const insertOrUpdatePageAtPosition = (pageRef: MashroomPortalPageRef, pages: Array<MashroomPortalPageRef>, newPosition: PagePosition, currentParentPageId?: string | undefined | null): void => {
    if (typeof(currentParentPageId) !== 'undefined') {
        // Remove existing
        removePageFromTree(pageRef.pageId, currentParentPageId, pages);
    }

    const parent = newPosition.parentPageId ? searchPageRef(newPosition.parentPageId, pages) : null;
    if (parent && !parent.subPages) {
        (parent as Writable<MashroomPortalPageRef>).subPages = [];
    }
    const subPages = parent ? parent.subPages! : pages;

    const index = newPosition.insertAfterPageId ? subPages.findIndex((p) => p.pageId === newPosition.insertAfterPageId) + 1 : 0;
    subPages.splice(index, 0, pageRef);
};

