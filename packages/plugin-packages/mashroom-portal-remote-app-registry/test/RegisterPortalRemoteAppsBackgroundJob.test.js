// @flow

import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import RegisterPortalRemoteAppsBackgroundJob from '../src/js/jobs/RegisterPortalRemoteAppsBackgroundJob';

import type {MashroomPluginDefinition} from '@mashroom/mashroom/type-definitions';


describe('RegisterPortalRemoteAppsBackgroundJob', () => {

    const pluginContextHolder: any = {
        getPluginContext: () => {
            return {
                loggerFactory: dummyLoggerFactory
            }
        }
    };

    const packageJson: any = {
        name: 'Test',
        version: '5.1.2',
        description: 'Test package',
        author: 'juergen.kofler@nonblocking.at',
        homepage: 'https://www.mashroom-server.com',
        license: 'MIT',
        mashroom: {}
    };

    const pluginDefinition: MashroomPluginDefinition = {
        name: 'Test App',
        description: 'Test App',
        type: 'portal-app',
        category: 'Test App',
        bootstrap: 'startTestApp',
        resources: {
            js: [
                'bundle.js'
            ]
        },
        screenshots: [
            'assets/screenshot1.png',
            'assets/screenshot2.png'
        ],
        requires: [],
        defaultConfig: {
            metaInfo: {
                test: 1
            },
            resourcesRoot: './dist/frontend',
            restProxies: {
                'bff': {
                    targetUri: 'http://localhost:4444/api',
                    sendUserHeader: true,
                    sendPermissionsHeader: true
                }
            },
            rolePermissions: {},
            appConfig: {
                customerId: '123123'
            }
        }
    };

    const remotePortalAppEndpoint: any = {
        url: 'https://www.mashroom-server.com/test-remote-app'
    };

    it('maps the plugin definition correctly', () => {
        const service = new RegisterPortalRemoteAppsBackgroundJob(3600, 10, pluginContextHolder);

        const portalApp = service._mapPluginDefinition(packageJson, pluginDefinition, remotePortalAppEndpoint);

        expect(portalApp).toBeTruthy();
        expect(portalApp.lastReloadTs).toBeTruthy();

        const fixedPortalApp = Object.assign({}, portalApp, {
            lastReloadTs: 22
        });
        expect(fixedPortalApp).toEqual({
            name: 'Test App',
            description: 'Test App',
            tags: [],
            version: '5.1.2',
            homepage: 'https://www.mashroom-server.com',
            author: 'juergen.kofler@nonblocking.at',
            license: 'MIT',
            category: 'Test App',
            metaInfo: {
                test: 1
            },
            lastReloadTs: 22,
            globalLaunchFunction: 'startTestApp',
            resourcesRootUri: 'https://www.mashroom-server.com/test-remote-app',
            resources: {
                js: ['bundle.js'],
                css: undefined
            },
            globalResources: null,
            screenshots: ['assets/screenshot1.png', 'assets/screenshot2.png'],
            defaultRestrictedToRoles: undefined,
            rolePermissions: {},
            restProxies:
                {
                    bff:
                        {
                            targetUri: 'https://www.mashroom-server.com/test-remote-app/api',
                            sendUserHeader: true,
                            sendPermissionsHeader: true
                        }
                },
            defaultAppConfig: {
                customerId: '123123'
            }
        });
    });

});
