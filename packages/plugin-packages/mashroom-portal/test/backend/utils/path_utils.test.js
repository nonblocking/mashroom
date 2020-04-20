// @flow

import {setPortalPluginConfig} from '../../../src/backend/context/global_portal_context';
import {
    getSitePath,
    getFrontendApiResourcesBasePath,
    getFrontendSiteBasePath
} from '../../../src/backend/utils/path_utils';

const portalConfig: any = {
    path: '/portal',
};
setPortalPluginConfig(portalConfig);

describe('path_utils', () => {

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
                            getMappingInfo() {
                                return {
                                    frontendBasePath: '/mashroom-portal',
                                };
                            },
                        },
                    },
                },
            },
        };

        expect(getFrontendSiteBasePath(req)).toBe('/mashroom-portal');
    });

    it('resolves the frontend API and resources base path', () => {
        const req: any = {
            params: {
                sitePath: 'web1',
            },
            pluginContext: {
                services: {
                },
            },
        };

        expect(getFrontendApiResourcesBasePath(req)).toBe('/portal/web1/___');
    });

    it('resolves the frontend API and resources base path when virtual host path mapping is active', () => {
        const req: any = {
            params: {
                sitePath: 'web1',
            },
            pluginContext: {
                services: {
                    vhostPathMapper: {
                        service: {
                            getMappingInfo() {
                                return {
                                    frontendBasePath: '/mashroom-portal',
                                };
                            },
                        },
                    },
                },
            },
        };

        expect(getFrontendApiResourcesBasePath(req)).toBe('/mashroom-portal/___');
    });

});
