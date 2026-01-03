import {readFileSync} from 'fs';
import {resolve} from 'path';
import {configFileUtils, loggingUtils} from '@mashroom/mashroom-utils';
import nock from 'nock';
import mapOpenMicrofrontendsToPortalApp2 from '../../src/def-builder/mapOpenMicrofrontendsToPortalApp2';
import type {MashroomPluginScannerHints} from '@mashroom/mashroom/type-definitions';

describe('mapOpenMicrofrontendsToPortalApp2', () => {

    it('maps a OpenMicrofrontends description', async () => {
        nock('http://localhost:1234')
            .get('/build.yaml')
            .reply(200, `
version: 2.1.3
            `);

        const description = configFileUtils.fromYaml(readFileSync(resolve(__dirname, '../mock/description.yaml'), 'utf-8'));
        const scannerHints: MashroomPluginScannerHints = {
        };

        const definition = await mapOpenMicrofrontendsToPortalApp2(new URL('http://localhost:1234'), scannerHints, description, loggingUtils.dummyLoggerFactory());

        expect(definition).toBeTruthy();
        expect(definition.packageUrl.toString()).toBe('http://localhost:1234/');
        expect(definition.meta).toEqual({
            author: 'OpenMicrofrontends',
            description: 'Example definition of microfrontends for testing',
            homepage: null,
            license: null,
            name: 'localhost',
            version: '2.1.3'
        });
        expect(definition.definition).toEqual({
            buildManifestPath: '/build.yaml',
            plugins: [
                {
                    name: 'My First Microfrontend',
                    type: 'portal-app2',
                    clientBootstrap: 'startMyFirstMicrofrontend',
                    remote: {
                        resourcesRoot: '/',
                        ssrInitialHtmlPath: '/ssr'
                    },
                    resources: {
                        css: [
                            'styles.css'
                        ],
                        importMap: {
                            imports: {
                                externalModule1: 'https://ga.jspm.io/npm:externalModule1@1.2.2/index.js',
                                externalModule2: 'https://ga.jspm.io/npm:externalModule2@5.1.8/index.js'
                            }
                        },
                        js: [
                            'Microfrontend.js'
                        ],
                        moduleSystem: 'ESM'
                    },
                    defaultConfig: {
                        title: {
                            de: 'Mein erstes Microfrontend',
                            en: 'My First Microfrontend'
                        },
                        description: 'An example microfrontend that shows all the features of the OpenMicrofrontends schema',
                        defaultRestrictViewToRoles: [
                            'role3'
                        ],
                        rolePermissions: {
                            deleteCustomer: [
                                'role1',
                                'role2'
                            ]
                        },
                        metaInfo: {
                            openMicrofrontends: true,
                            myCustomProperty: 'myCustomValue',
                        },
                        proxies: {
                            proxy1: {
                                restrictToRoles: [
                                    'role4',
                                    'role5'
                                ],
                                targetPath: '/api'
                            },
                            proxy2: {
                                targetUri: 'https://localhost:1234/api'
                            }
                        },
                        appConfig: {
                            customerId: '1000'
                        },
                    },
                }
            ]
        });
    });

});
