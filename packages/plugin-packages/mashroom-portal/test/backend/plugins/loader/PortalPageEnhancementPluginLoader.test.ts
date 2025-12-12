
import {parse} from 'path';
import {pathToFileURL} from 'url';
import {loggingUtils} from '@mashroom/mashroom-utils';
import PortalPageEnhancementPluginLoader from '../../../../src/backend/plugins/loader/PortalPageEnhancementPluginLoader';
import MashroomPortalPluginRegistry from '../../../../src/backend/plugins/MashroomPortalPluginRegistry';

import type {MashroomPlugin} from '@mashroom/mashroom/type-definitions';

describe('PortalPageEnhancementPluginLoader', () => {

    it('loads and registers page enhancements with a relative local resource root', async () => {
        const pluginPackage: any = {
            pluginPackageURL: pathToFileURL('/opt/mashroom/packages/test'),
        };

        const pageEnhancementPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal Page Enhancement 1',
            description: null,
            tags: [],
            type: 'portal-page-enhancement',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => { throw new Error('not implemented'); },
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal Page Enhancement 1',
                type: 'portal-page-enhancement',
                // bootstrap: './dist/mashroom-bootstrap.js',
                resourcesRoot: './dist/page-enhancements',
                pageResources: {
                    js: [{
                        path: 'test.js',
                        location: 'header',
                        inline: true
                    }, {
                        dynamicResource: 'myScript',
                        location: 'header'
                    }],
                    css: [{
                        path: 'test.css'
                    }]
                },
                defaultConfig: {
                    order: '500'
                }
            },
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalPageEnhancementPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        await loader.load(pageEnhancementPlugin, {}, context);

        expect(registry.portalPageEnhancements.length).toBe(1);
        expect(registry.portalPageEnhancements[0].pageResources).toEqual({
            css: [
                {
                    path: 'test.css'
                }
            ],
            js: [
                {
                    inline: true,
                    location: 'header',
                    path: 'test.js'
                },
                {
                    dynamicResource: 'myScript',
                    location: 'header'
                }
            ]
        });

        if (process.platform === 'win32') {
            const {root} = parse(__dirname);
            expect(registry.portalPageEnhancements[0].resourcesRootUri).toBe(`file://${root}opt\\mashroom\\packages\\test\\dist\\page-enhancements`);
        } else {
            expect(registry.portalPageEnhancements[0].resourcesRootUri).toBe('file:///opt/mashroom/packages/test/dist/page-enhancements');
        }
    });

    it('loads and registers page enhancements with an absolute local resource root', async () => {

        const pluginPackage: any = {
            pluginPackageURL: pathToFileURL('/opt/mashroom/packages/test'),
        };

        const pageEnhancementPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal Page Enhancement 1',
            description: null,
            tags: [],
            type: 'portal-page-enhancement',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => { throw new Error('not implemented'); },
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal Page Enhancement 1',
                type: 'portal-page-enhancement',
                resourcesRoot: '/opt/mashroom/page-enhancements',
                pageResources: {
                    js: [{
                        path: 'test.js',
                        location: 'header',
                        inline: true
                    }, {
                        dynamicResource: 'myScript',
                        location: 'header'
                    }],
                    css: [{
                        path: 'test.css'
                    }]
                },
                defaultConfig: {
                    order: '500'
                }
            },
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalPageEnhancementPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        await loader.load(pageEnhancementPlugin, {}, context);

        expect(registry.portalPageEnhancements.length).toBe(1);

        if (process.platform === 'win32') {
            const {root} = parse(__dirname);
            expect(registry.portalPageEnhancements[0].resourcesRootUri).toBe(`file://${root}opt\\mashroom\\page-enhancements`);
        } else {
            expect(registry.portalPageEnhancements[0].resourcesRootUri).toBe('file:///opt/mashroom/page-enhancements');
        }
    });

    it('loads and registers page enhancements with a relative remote resource root', async () => {
        const pluginPackage: any = {
            pluginPackageURL: new URL('https://my.server/foo'),
        };

        const pageEnhancementPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal Page Enhancement 1',
            description: null,
            tags: [],
            type: 'portal-page-enhancement',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => { throw new Error('not implemented'); },
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal Page Enhancement 1',
                type: 'portal-page-enhancement',
                resourcesRoot: './dist/page-enhancements',
                pageResources: {
                    js: [{
                        path: 'test.js',
                        location: 'header',
                        inline: true
                    }, {
                        dynamicResource: 'myScript',
                        location: 'header'
                    }],
                    css: [{
                        path: 'test.css'
                    }]
                },
                defaultConfig: {
                    order: '500'
                }
            },
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalPageEnhancementPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        await loader.load(pageEnhancementPlugin, {}, context);

        expect(registry.portalPageEnhancements.length).toBe(1);
        expect(registry.portalPageEnhancements[0].resourcesRootUri).toBe('https://my.server/foo/dist/page-enhancements');
    });
});
