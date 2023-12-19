
import {setPortalPluginConfig} from '../../../src/backend/context/global-portal-context';
import {
    getSitePath,
    getFrontendApiBasePath,
    getFrontendSiteBasePath, getFrontendResourcesBasePath
} from '../../../src/backend/utils/path-utils';

const portalConfig: any = {
    path: '/portal',
};
setPortalPluginConfig(portalConfig);

describe('path-utils', () => {

    it('resolves the site path', () => {
        const req: any = {
            params: {
                sitePath: 'web1',
            }
        };

        expect(getSitePath(req)).toBe('/web1');
    });

    it('resolves the frontend site base path', () => {
        const req: any = {
            params: {
                sitePath: 'web1',
            },
            pluginContext: {
                services: {
                },
            },
        };

        expect(getFrontendSiteBasePath(req)).toBe('/portal/web1');
    });


    it('resolves the frontend site base path when virtual host path mapping is active', () => {
        const req: any = {
            params: {
                sitePath: 'web1',
            },
            pluginContext: {
                services: {
                    vhostPathMapper: {
                        service: {
                            getFrontendUrl() {
                                return '/mashroom-portal';
                            },
                        },
                    },
                },
            },
        };

        expect(getFrontendSiteBasePath(req)).toBe('/mashroom-portal');
    });

    it('resolves the frontend API path', () => {
        const req: any = {
            params: {
                sitePath: 'web1',
            },
            pluginContext: {
                services: {
                },
            },
        };

        expect(getFrontendApiBasePath(req)).toBe('/portal/web1/___');
    });

    it('resolves the resource base path', () => {
        const req: any = {
            params: {
                sitePath: 'web1',
            },
            pluginContext: {
                services: {
                },
            },
        };

        expect(getFrontendResourcesBasePath(req, null)).toBe('/portal/web1/___');
    });

    it('resolves the resource base path when a CDN is present', () => {
        const req: any = {
            params: {
                sitePath: 'web1',
            },
            pluginContext: {
                services: {
                },
            },
        };

        expect(getFrontendResourcesBasePath(req, '//locahost:1234')).toBe('//locahost:1234/portal/web1/___');
    });

    it('resolves the frontend API base path when virtual host path mapping is active', () => {
        const req: any = {
            params: {
                sitePath: 'web1',
            },
            pluginContext: {
                services: {
                    vhostPathMapper: {
                        service: {
                            getFrontendUrl() {
                                return '/mashroom-portal';
                            },
                        },
                    },
                },
            },
        };

        expect(getFrontendApiBasePath(req)).toBe('/mashroom-portal/___');
    });

});
