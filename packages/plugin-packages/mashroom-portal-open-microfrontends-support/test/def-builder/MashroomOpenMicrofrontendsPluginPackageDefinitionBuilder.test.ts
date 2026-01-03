import {resolve} from 'path';
import {loggingUtils} from '@mashroom/mashroom-utils';
import nock from 'nock';
import MashroomOpenMicrofrontendsPluginPackageDefinitionBuilder from '../../src/def-builder/MashroomOpenMicrofrontendsPluginPackageDefinitionBuilder';
import type {MashroomPluginScannerHints} from '@mashroom/mashroom/type-definitions';

describe('MashroomOpenMicrofrontendsPluginPackageDefinitionBuilder', () => {

    it('builds an definition for a OpenMicrofrontends descriptor', async () => {
        nock('http://localhost:3333')
            .get('/microfrontends.yaml')
            .replyWithFile(200, resolve(__dirname, '../mock/description.yaml'));

        const scannerHints: MashroomPluginScannerHints = {
            packageName: 'my-omf-microfrontend',
            packageVersion: '1.0.1',
        };

        const builder = new MashroomOpenMicrofrontendsPluginPackageDefinitionBuilder(loggingUtils.dummyLoggerFactory);

        const definitions = await builder.buildDefinition(new URL('http://localhost:3333'), scannerHints);

        expect(definitions).toBeTruthy();
        expect(definitions?.length).toBe(1);

        const definition = definitions![0];

        expect(definition).toBeTruthy();
        expect(definition.packageUrl.toString()).toBe('http://localhost:3333/');
        expect(definition.meta).toEqual({
            author: 'OpenMicrofrontends',
            description: 'Example definition of microfrontends for testing',
            homepage: null,
            license: null,
            name: 'my-omf-microfrontend',
            version: '1.0.1'
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
                        moduleSystem: 'ESM',
                        importMap: {
                            imports: {
                                externalModule1: 'https://ga.jspm.io/npm:externalModule1@1.2.2/index.js',
                                externalModule2: 'https://ga.jspm.io/npm:externalModule2@5.1.8/index.js'
                            }
                        },
                        js: [
                            'Microfrontend.js'
                        ],
                        css: [
                            'styles.css'
                        ],
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
