
import SitePagesTraverser from '../../../src/backend/utils/SitePagesTraverser';

describe('SitePagesTraverser', () => {

    it('searches a page in the site pages tree', () => {
        const pages = [{
            pageId: 'home',
            title: 'Welcome',
            friendlyUrl: '/',
        }, {
            pageId: 'test',
            title: 'Test',
            friendlyUrl: '/foo',
        }, {
            pageId: 'test client side routing',
            title: 'Test Client Side Routing',
            friendlyUrl: '/cs',
            clientSideRouting: true,
        }, {
            pageId: 'level1',
            title: 'Tree Test',
            friendlyUrl: '/l1',
            subPages: [{
                pageId: 'level2',
                title: 'Tree Test',
                friendlyUrl: '/l1/l2',
                subPages: [{
                    pageId: 'level3',
                    title: 'Tree Test',
                    friendlyUrl: '/l1/l2/l3',
                }],
            }],
        }];

        const traverser = new SitePagesTraverser(pages);

        expect(traverser.findPageByFriendlyUrl('/')).toEqual({
            pageId: 'home',
            title: 'Welcome',
            friendlyUrl: '/',
        });

        expect(traverser.findPageByFriendlyUrl('/foo/')).toEqual({
            pageId: 'test',
            title: 'Test',
            friendlyUrl: '/foo',
        });

        expect(traverser.findPageByFriendlyUrl('/l1/l2/l3')).toEqual({
            pageId: 'level3',
            title: 'Tree Test',
            friendlyUrl: '/l1/l2/l3',
        });

        expect(traverser.findPageByFriendlyUrl('/cs/whats/o/every')).toEqual({
            pageId: 'test client side routing',
            title: 'Test Client Side Routing',
            friendlyUrl: '/cs',
            clientSideRouting: true,
        });
    });

});
