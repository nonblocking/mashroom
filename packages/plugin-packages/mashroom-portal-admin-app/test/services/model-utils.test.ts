
import {readFileSync} from 'fs';
import {resolve} from 'path';

import {flattenPageTree, searchPageRef, getPagePosition, removePageFromTree, insertOrUpdatePageAtPosition} from '../../src/js/services/model-utils';

import type {MashroomPortalPageRef, MashroomPortalSite} from '@mashroom/mashroom-portal/type-definitions';

const loadSite = () => {
    return JSON.parse(readFileSync(resolve(__dirname, 'site.json')).toString());
};

describe('model-utils.flattenPageTree', () => {

    it('flattens a hierarchical page tree', () => {
        const site: any = loadSite();
        const flattened = flattenPageTree(site.pages);

        expect(flattened).toBeTruthy();
        expect(flattened.length).toBe(6);
    });

});

describe('model-utils.searchPageRef', () => {

    it('finds an existing page in the hierarchical tree', () => {
        const site: MashroomPortalSite = loadSite();

        const pageRef = searchPageRef('subpage2', site.pages);

        expect(pageRef).toBeTruthy();
        if (pageRef) {
            expect(pageRef.pageId).toBe('subpage2');
        }
    });

    it('returns undefined for a non existing page', () => {
        const site: MashroomPortalSite = loadSite();

        const pageRef = searchPageRef('xxxxx', site.pages);

        expect(pageRef).toBeFalsy();
    });

});

describe('model-utils.getPagePosition', () => {

    it('returns the correct position for an existing page in the hierarchical tree', () => {
        const site: any = loadSite();
        const flattened = flattenPageTree(site.pages);

        const position = getPagePosition('subpage2', flattened, site.pages);

        expect(position).toBeTruthy();
        expect(position).toEqual({
            parentPageId: 'test1',
            insertAfterPageId: 'subpage1'
        });
    });

    it('returns the correct position for a top level page', () => {
        const site: any = loadSite();
        const flattened = flattenPageTree(site.pages);

        const position = getPagePosition('test2', flattened, site.pages);

        expect(position).toBeTruthy();
        expect(position).toEqual({
            parentPageId: null,
            insertAfterPageId: 'test1'
        });
    });

});

describe('model-utils.removePageFromTree', () => {

    it('removes an existing page from the tree', () => {
        const site: MashroomPortalSite = loadSite();

        expect(searchPageRef('subpage2', site.pages)).toBeTruthy();

        removePageFromTree('subpage2', 'test1', site.pages);

        expect(searchPageRef('subpage2', site.pages)).toBeFalsy();

        expect(searchPageRef('subpage22', site.pages)).toBeFalsy();
    });

    it('it retains subpages of the removed page', () => {
        const site: MashroomPortalSite = loadSite();

        expect(searchPageRef('subpage2', site.pages)).toBeTruthy();

        removePageFromTree('subpage2', 'test1', site.pages, true);

        expect(searchPageRef('subpage2', site.pages)).toBeFalsy();

        expect(searchPageRef('subpage22', site.pages)).toBeTruthy();
    });

});

describe('model-utils.insertOrUpdatePageAtPosition', () => {

    it('inserts a new page below a given parent node', () => {
        const site: any = loadSite();

        const pageRef: MashroomPortalPageRef = {
            pageId: 'newPage',
            title: {
                en: 'New page',
                de: 'Neue Seite'
            },
            friendlyUrl: '/foo/page'
        };

        insertOrUpdatePageAtPosition(pageRef, site.pages, {parentPageId: 'test1', insertAfterPageId: 'subpage1'});
        const flattened = flattenPageTree(site.pages);

        const foundPageRef = searchPageRef('newPage', site.pages);
        const position = getPagePosition('newPage', flattened, site.pages);

        expect(foundPageRef).toBeTruthy();
        expect(foundPageRef).toEqual(pageRef);
        expect(position).toEqual({
            parentPageId: 'test1',
            insertAfterPageId: 'subpage1'
        })
    });

    it('inserts a new page at the top level', () => {
        const site: any = loadSite();

        const pageRef: MashroomPortalPageRef = {
            pageId: 'newPage',
            title: {
                en: 'New page',
                de: 'Neue Seite'
            },
            friendlyUrl: '/foo/page'
        };

        insertOrUpdatePageAtPosition(pageRef, site.pages, {parentPageId: null, insertAfterPageId: 'test2'});
        const flattened = flattenPageTree(site.pages);

        const foundPageRef = searchPageRef('newPage', site.pages);
        const position = getPagePosition('newPage', flattened, site.pages);

        expect(foundPageRef).toBeTruthy();
        expect(foundPageRef).toEqual(pageRef);
        expect(position).toEqual({
            parentPageId: null,
            insertAfterPageId: 'test2'
        })
    });

    it('updates an existing page ref', () => {
        const site: any = loadSite();

        const pageRef: MashroomPortalPageRef = {
            pageId: 'test2',
            title: {
                en: 'New page',
                de: 'Neue Seite'
            },
            friendlyUrl: '/foo/page'
        };

        insertOrUpdatePageAtPosition(pageRef, site.pages, {parentPageId: null, insertAfterPageId: 'test1'}, null);
        const flattened = flattenPageTree(site.pages);

        const foundPageRef = searchPageRef('test2', site.pages);
        const position = getPagePosition('test2', flattened, site.pages);

        expect(foundPageRef).toBeTruthy();
        expect(foundPageRef).toEqual(pageRef);
        expect(position).toEqual({
            parentPageId: null,
            insertAfterPageId: 'test1'
        })
    });

    it('move an existing page to another position', () => {
        const site: any = loadSite();

        const pageRef: MashroomPortalPageRef = {
            pageId: 'test2',
            title: {
                en: 'New page',
                de: 'Neue Seite'
            },
            friendlyUrl: '/foo/page'
        };

        insertOrUpdatePageAtPosition(pageRef, site.pages, {parentPageId: 'test1', insertAfterPageId: 'subpage1'}, null);
        const flattened = flattenPageTree(site.pages);

        const foundPageRef = searchPageRef('test2', site.pages);
        const position = getPagePosition('test2', flattened, site.pages);

        expect(foundPageRef).toBeTruthy();
        expect(foundPageRef).toEqual(pageRef);
        expect(position).toEqual({
            parentPageId: 'test1',
            insertAfterPageId: 'subpage1'
        })
    });

});
