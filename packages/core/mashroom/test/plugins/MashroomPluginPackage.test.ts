
import path from 'path';
import fsExtra from 'fs-extra';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomPluginPackage from '../../src/plugins/MashroomPluginPackage';

const getPluginPackageFolder = () => {
    const pluginPackageFolder = path.resolve(__dirname, '../../test-data/plugins2/test3');
    fsExtra.emptyDirSync(pluginPackageFolder);
    fsExtra.writeJsonSync(path.resolve(pluginPackageFolder, 'package.json'), {
        name: 'test3',
        description: 'description test3',
        version: '1.1.3',
        license: 'BSD-3-Clause',
        author: {
            'name': 'Jürgen Kofler',
            'email': 'juergen.kofler@nonblocking.at',
            'url': 'http://www.nonblocking.at',
        },
        mashroom: {
            devModeBuildScript: 'builddd',
            plugins: [
                {
                    name: 'Plugin 1',
                    type: 'web-app',
                    bootstrap: './dist/mashroom-bootstrap.js',
                    defaultConfig: {
                        foo: 'bar',
                    },
                },
                {
                    name: 'Plugin 2',
                    type: 'plugin-loader',
                    bootstrap: './dist/mashroom-bootstrap2.js',
                    dependencies: ['foo-services'],
                },
                {
                    name: 'Plugin 3',
                    type: 'foo',
                    bootstrap: 'foo',
                },
                {
                    name: 'Plugin 6',
                    description: 'Invalid - should be ignored',
                },
            ],
        },
    });
    return pluginPackageFolder;
};

const getPluginPackageFolder2 = () => {
    const pluginPackageFolder = path.resolve(__dirname, '../../test-data/plugins3/test1');
    fsExtra.emptyDirSync(pluginPackageFolder);
    fsExtra.writeJsonSync(path.resolve(pluginPackageFolder, 'package.json'), {
        name: 'test2',
        description: 'test no plugin names',
        version: '1.1.3',
        license: 'BSD-3-Clause',
        author: {
            'name': 'Jürgen Kofler',
            'email': 'juergen.kofler@nonblocking.at',
            'url': 'http://www.nonblocking.at',
        },
        mashroom: {
            plugins: [
                {
                    name: 'Plugin 1',
                    type: 'web-app',
                    bootstrap: './dist/mashroom-bootstrap.js',
                },
                {
                    type: 'plugin-loader',
                    bootstrap: './dist/mashroom-bootstrap2.js',
                }
            ],
        },
    });
    return pluginPackageFolder;
};

const getPluginPackageFolder3 = () => {
    const pluginPackageFolder = path.resolve(__dirname, '../../test-data/plugins4/test1');
    fsExtra.emptyDirSync(pluginPackageFolder);
    fsExtra.writeJsonSync(path.resolve(pluginPackageFolder, 'package.json'), {
        name: 'test3',
        description: 'test no plugin names',
        version: '1.1.3',
        license: 'BSD-3-Clause',
        author: {
            'name': 'Jürgen Kofler',
            'email': 'juergen.kofler@nonblocking.at',
            'url': 'http://www.nonblocking.at',
        },
        mashroom: {
            plugins: [
                {
                    name: 'Plugin 1',
                    type: 'web-app',
                    bootstrap: './dist/mashroom-bootstrap.js',
                },
                {
                    name: 'Plugin 2/3',
                    type: 'plugin-loader',
                    bootstrap: './dist/mashroom-bootstrap2.js',
                },
                {
                    name: 'Plugin 3?',
                    type: 'plugin-loader',
                    bootstrap: './dist/mashroom-bootstrap3.js',
                }
            ],
        },
    });
    return pluginPackageFolder;
};

const registryConnectorOnMock = jest.fn();
const registryConnectorRemoveListenerMock = jest.fn();
const RegistryConnectorMock: any = jest.fn(() => ({
    on: registryConnectorOnMock,
    removeListener: registryConnectorRemoveListenerMock,
}));

const builderOnMock = jest.fn();
const builderRemoveListenerMock = jest.fn();
const builderAddToBuildQueueMock = jest.fn();
const BuilderMock: any = jest.fn(() => ({
    on: builderOnMock,
    removeListener: builderRemoveListenerMock,
    addToBuildQueue: builderAddToBuildQueueMock,
}));

describe('MashroomPluginPackage', () => {

    beforeEach(() => {
        registryConnectorOnMock.mockReset();
        registryConnectorRemoveListenerMock.mockReset();
        builderOnMock.mockReset();
        builderRemoveListenerMock.mockReset();
        builderAddToBuildQueueMock.mockReset();
    });

    it('reads a new package builds it an emits ready', (done) => {
        const pluginPackagePath = getPluginPackageFolder();
        let buildFinishedCallback: any = null;

        builderOnMock.mockImplementation((event, callback) => {
            if (event === 'build-finished') {
                buildFinishedCallback = callback;
            }
        });

        builderAddToBuildQueueMock.mockImplementation((pluginPackageName, _pluginPackagePath, buildScript) => {
            expect(pluginPackageName).toBe('test3');
            expect(_pluginPackagePath).toBe(pluginPackagePath);
            expect(buildScript).toBe('builddd');
            expect(buildFinishedCallback).toBeTruthy();
            setTimeout(() => {
                if (buildFinishedCallback) {
                    // Other build
                    buildFinishedCallback({
                        pluginPackageName: 'foooo',
                        success: false,
                    });
                    buildFinishedCallback({
                        pluginPackageName,
                        success: true,
                    });
                }
            }, 200);
        });

        const pluginPackage = new MashroomPluginPackage(pluginPackagePath, [], new RegistryConnectorMock(), new BuilderMock(), dummyLoggerFactory);

        // Set existing plugins
        // @ts-ignore
        pluginPackage._pluginDefinitions = [
            {name: 'Plugin 3', type: 'foo', bootstrap: 'foo'},
            {name: 'Plugin 4', type: 'foo', bootstrap: 'foo'}];

        expect(pluginPackage.status).toBe('building');

        pluginPackage.on('ready', (event) => {
            expect(pluginPackage.name).toBe('test3');
            expect(pluginPackage.description).toBe('description test3');
            expect(pluginPackage.version).toBe('1.1.3');
            expect(pluginPackage.license).toBe('BSD-3-Clause');
            expect(pluginPackage.author).toBe('Jürgen Kofler <juergen.kofler@nonblocking.at>');
            expect(pluginPackage.status).toBe('ready');
            expect(pluginPackage.pluginPackagePath).toBe(pluginPackagePath);
            expect(pluginPackage.pluginDefinitions).toBeTruthy();
            expect(pluginPackage.pluginDefinitions.length).toBe(3);
            expect(event.pluginsAdded).toBeTruthy();
            expect(event.pluginsAdded && event.pluginsAdded.length).toBe(2);
            expect(event.pluginsRemoved && event.pluginsRemoved.length).toBe(1);
            expect(event.pluginsUpdated && event.pluginsUpdated.length).toBe(1);

            done();
        });
    });

    it('emits error if a build error occurs', (done) => {
        const pluginPackagePath = getPluginPackageFolder();
        let buildFinishedCallback: any = null;

        builderOnMock.mockImplementation((event, callback) => {
            if (event === 'build-finished') {
                buildFinishedCallback = callback;
            }
        });

        builderAddToBuildQueueMock.mockImplementation((pluginPackageName) => {
            setTimeout(() => {
                if (buildFinishedCallback) {
                    buildFinishedCallback({
                        pluginPackageName,
                        success: false,
                        errorMessage: 'build errror!',
                    });
                }
            }, 200);
        });

        const pluginPackage = new MashroomPluginPackage(pluginPackagePath, [], new RegistryConnectorMock(), new BuilderMock(), dummyLoggerFactory);
        expect(pluginPackage.status).toBe('building');

        pluginPackage.on('error', (event) => {
            expect(pluginPackage.status).toBe('error');
            expect(pluginPackage.errorMessage).toBe('build errror!');

            done();
        });
    });

    it('ignores plugins without a name', (done) => {
        const pluginPackagePath = getPluginPackageFolder2();
        let buildFinishedCallback: any = null;

        builderOnMock.mockImplementation((event, callback) => {
            if (event === 'build-finished') {
                buildFinishedCallback = callback;
            }
        });

        builderAddToBuildQueueMock.mockImplementation((pluginPackageName) => {
            setTimeout(() => {
                if (buildFinishedCallback) {
                    buildFinishedCallback({
                        pluginPackageName,
                        success: true,
                    });
                }
            }, 200);
        });

        const pluginPackage = new MashroomPluginPackage(pluginPackagePath, [], new RegistryConnectorMock(), new BuilderMock(), dummyLoggerFactory);

        expect(pluginPackage.status).toBe('building');

        pluginPackage.on('ready', (ready) => {
            expect(pluginPackage.status).toBe('ready');
            expect(pluginPackage.pluginDefinitions.length).toBe(1);

            done();
        });
    });

    it('ignores plugins with invalid names', (done) => {
        const pluginPackagePath = getPluginPackageFolder3();
        let buildFinishedCallback: any = null;

        builderOnMock.mockImplementation((event, callback) => {
            if (event === 'build-finished') {
                buildFinishedCallback = callback;
            }
        });

        builderAddToBuildQueueMock.mockImplementation((pluginPackageName) => {
            setTimeout(() => {
                if (buildFinishedCallback) {
                    buildFinishedCallback({
                        pluginPackageName,
                        success: true,
                    });
                }
            }, 200);
        });

        const pluginPackage = new MashroomPluginPackage(pluginPackagePath, [], new RegistryConnectorMock(), new BuilderMock(), dummyLoggerFactory);

        expect(pluginPackage.status).toBe('building');

        pluginPackage.on('ready', (ready) => {
            expect(pluginPackage.status).toBe('ready');
            expect(pluginPackage.pluginDefinitions.length).toBe(1);

            done();
        });
    });
});
