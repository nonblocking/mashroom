import ImportMapManager from '../../../src/frontend/portal-client/js/ImportMapManager';
import type {MashroomImportMapConnector, ImportMap} from '../../../type-definitions/internal';
import type {MashroomPortalAppSetup} from '../../../type-definitions';

describe('ImportMapManager', () => {

    const dummyConnectorFactory: () => MashroomImportMapConnector = () => {
        let _importMap: ImportMap | undefined;
        return {
            addImportMap(importMap: ImportMap) {
                _importMap = importMap;
            },
            getImportMap() {
                return _importMap;
            }
        };
    };

    it('adds the import map for a Portal App', () => {
        const dummyConnector = dummyConnectorFactory();

        const appSetup: Partial<MashroomPortalAppSetup> = {
            version: '1.1.1',
            versionHash: '1.1.1',
            resourcesBasePath: '/foo/bar',
            resources: {
                moduleSystem: 'SystemJS',
                importMap: {
                    imports: {
                        module1: 'http://localhost:12345/module1.js',
                        module2: 'http://localhost:12345/module2.js',
                    }
                },
                js: ['index.js']
            }
        };

        const manager = new ImportMapManager();

        manager.addImportMap(appSetup as MashroomPortalAppSetup, dummyConnector);

        expect(dummyConnector.getImportMap()).toEqual({
            imports: {
                '/foo/bar/index.js': '/foo/bar/index.js?v=1.1.1',
                module1: 'http://localhost:12345/module1.js',
                module2: 'http://localhost:12345/module2.js',
            },
            scopes: {},
        });
    });

    it('ignores existing imports', () => {
        const dummyConnector = dummyConnectorFactory();

        const appSetup: Partial<MashroomPortalAppSetup> = {
            version: '1.1.1',
            versionHash: '1.1.1',
            resourcesBasePath: '/foo/bar',
            resources: {
                moduleSystem: 'SystemJS',
                importMap: {
                    imports: {
                        module1: 'http://localhost:12345/module1.js',
                        module2: 'http://localhost:12345/module2.js',
                    }
                },
                js: ['index.js']
            }
        };

        const appSetup2: Partial<MashroomPortalAppSetup> = {
            version: '1.2.2',
            versionHash: '1.2.2',
            resourcesBasePath: '/foo/bar2',
            resources: {
                moduleSystem: 'SystemJS',
                importMap: {
                    imports: {
                        module1: 'http://localhost:12345/module1.js',
                        module2: 'http://localhost:12345/module2.js',
                    }
                },
                js: ['index.js']
            }
        };

        const manager = new ImportMapManager();

        manager.addImportMap(appSetup as MashroomPortalAppSetup, dummyConnector);
        manager.addImportMap(appSetup2 as MashroomPortalAppSetup, dummyConnector);

        expect(dummyConnector.getImportMap()).toEqual({
            imports: {
                '/foo/bar2/index.js': '/foo/bar2/index.js?v=1.2.2'
            },
            scopes: {},
        });
    });

    it('adds a scope for conflicting modules', () => {
        const dummyConnector = dummyConnectorFactory();

        dummyConnector.addImportMap({
            imports: {
                module1: 'http://localhost:3333/module1.js',
                module2: 'http://localhost:3333/module2.js',
            },
            scopes: {},
        });

        const appSetup: Partial<MashroomPortalAppSetup> = {
            version: '1.1.1',
            versionHash: '1.1.1',
            resourcesBasePath: '/foo/bar',
            resources: {
                moduleSystem: 'SystemJS',
                importMap: {
                    imports: {
                        module1: 'http://localhost:12345/module1.js',
                        module2: 'http://localhost:12345/module2.js',
                    }
                },
                js: ['index.js']
            }
        };

        const manager = new ImportMapManager();

        manager.addImportMap(appSetup as MashroomPortalAppSetup, dummyConnector);

        expect(dummyConnector.getImportMap()).toEqual({
            imports: {
                '/foo/bar/index.js': '/foo/bar/index.js?v=1.1.1'
            },
            scopes: {
                '/foo/bar/index.js?v=1.1.1': {
                    module1: 'http://localhost:12345/module1.js',
                    module2: 'http://localhost:12345/module2.js'
                },
                'http://localhost:12345/module1.js': {
                    module2: 'http://localhost:12345/module2.js'
                },
                'http://localhost:12345/module2.js': {
                    module1: 'http://localhost:12345/module1.js'
                }
            }
        });
    });
});
