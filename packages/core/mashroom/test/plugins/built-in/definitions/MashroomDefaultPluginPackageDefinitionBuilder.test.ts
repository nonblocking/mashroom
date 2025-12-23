
import {resolve} from 'path';
import {pathToFileURL} from 'url';
import {ensureDirSync, emptyDirSync, writeJsonSync, writeFileSync} from 'fs-extra';
import {loggingUtils} from '@mashroom/mashroom-utils';
import nock from 'nock';
import MashroomDefaultPluginPackageDefinitionBuilder from '../../../../src/plugins/built-in/definitions/MashroomDefaultPluginPackageDefinitionBuilder';

const pluginsDefinition = {
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
    ],
};

const pluginsDefinitionWithBuildManifest = {
    devModeBuildScript: 'build',
    buildManifestPath: '/buildManifest.json',
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
    ],
};

const packageJsonWithPlugins = {
    name: 'test1',
    description: 'description test3',
    version: '1.1.3',
    license: 'BSD-3-Clause',
    author: 'Jürgen Kofler <juergen.kofler@nonblocking.at>',
    mashroom: pluginsDefinition,
};

const getPluginPackagesFolder = () => {
    const pluginsFolder = resolve(__dirname, '../../../../test-data/plugins2');
    emptyDirSync(pluginsFolder);

    const plugin1Folder = resolve(pluginsFolder, 'test1');
    ensureDirSync(plugin1Folder);
    const plugin2Folder = resolve(pluginsFolder, 'test2');
    ensureDirSync(plugin2Folder);
    writeJsonSync(resolve(plugin1Folder, 'package.json'), packageJsonWithPlugins);
    writeJsonSync(resolve(plugin2Folder, 'package.json'), {
        name: 'test2',
        version: '2.1.1',
    });
    writeFileSync(resolve(plugin2Folder, 'mashroom.js'), `
        module.exports.default = ${JSON.stringify(pluginsDefinition, null, 2)};
    `);
    return pluginsFolder;
};

describe('MashroomDefaultPluginPackageDefinitionBuilder', () => {

    it('reads the plugin definition from package.json', async () => {
        const pluginPackagesFolder1 = resolve(getPluginPackagesFolder(), 'test1');

        const pluginDefinitionBuilder = new MashroomDefaultPluginPackageDefinitionBuilder({
            externalPluginConfigFileNames: ['mashroom']
        } as any, loggingUtils.dummyLoggerFactory);

        const pluginPackageDefinitions = await pluginDefinitionBuilder.buildDefinition(pathToFileURL(pluginPackagesFolder1), {});

        expect(pluginPackageDefinitions?.length).toBe(1);
        expect(pluginPackageDefinitions![0].packageURL).toBeTruthy();
        expect(pluginPackageDefinitions![0].definition).toEqual({
            devModeBuildScript: 'builddd',
            plugins: [
                {
                    bootstrap: './dist/mashroom-bootstrap.js',
                    defaultConfig: {
                        foo: 'bar'
                    },
                    name: 'Plugin 1',
                    type: 'web-app'
                },
                {
                    bootstrap: './dist/mashroom-bootstrap2.js',
                    dependencies: [
                        'foo-services'
                    ],
                    name: 'Plugin 2',
                    type: 'plugin-loader'
                },
            ]
        });
        expect(pluginPackageDefinitions![0].meta).toEqual({
            author: 'Jürgen Kofler <juergen.kofler@nonblocking.at>',
            description: 'description test3',
            license: 'BSD-3-Clause',
            name: 'test1',
            version: '1.1.3'
        });
    });

    it('reads the plugin definition from mashroom.json', async () => {
        const pluginPackagesFolder2 = resolve(getPluginPackagesFolder(), 'test2');

        const pluginDefinitionBuilder = new MashroomDefaultPluginPackageDefinitionBuilder({
            externalPluginConfigFileNames: ['mashroom']
        } as any, loggingUtils.dummyLoggerFactory);

        const pluginPackageDefinitions = await pluginDefinitionBuilder.buildDefinition(pathToFileURL(pluginPackagesFolder2), {});

        expect(pluginPackageDefinitions?.length).toBe(1);
        expect(pluginPackageDefinitions![0].packageURL).toBeTruthy();
        expect(pluginPackageDefinitions![0].definition).toEqual( {
            devModeBuildScript: 'builddd',
            plugins: [
                {
                    bootstrap: './dist/mashroom-bootstrap.js',
                    defaultConfig: {
                        foo: 'bar'
                    },
                    name: 'Plugin 1',
                    type: 'web-app'
                },
                {
                    bootstrap: './dist/mashroom-bootstrap2.js',
                    dependencies: [
                        'foo-services'
                    ],
                    name: 'Plugin 2',
                    type: 'plugin-loader'
                },
            ]
        });
        expect(pluginPackageDefinitions![0].meta).toEqual({
            name: 'test2',
            version: '2.1.1'
        });
    });

    it('reads the plugin definition from /package.json from a remote host', async () => {
        const remoteHost = new URL('http://my-remote-app.io:6066');

        nock(remoteHost.toString())
            .get('/package.json')
            .reply(200, packageJsonWithPlugins);
        nock(remoteHost.toString())
            .get('/mashroom.json')
            .reply(404);

        const pluginDefinitionBuilder = new MashroomDefaultPluginPackageDefinitionBuilder({
            externalPluginConfigFileNames: ['mashroom']
        } as any, loggingUtils.dummyLoggerFactory);

        const pluginPackageDefinitions = await pluginDefinitionBuilder.buildDefinition(remoteHost, {});

        expect(pluginPackageDefinitions?.length).toBe(1);
        expect(pluginPackageDefinitions![0].packageURL).toBeTruthy();
        expect(pluginPackageDefinitions![0].definition).toEqual({
            plugins: [
                {
                    bootstrap: './dist/mashroom-bootstrap.js',
                    defaultConfig: {
                        foo: 'bar'
                    },
                    name: 'Plugin 1',
                    type: 'web-app'
                },
                {
                    bootstrap: './dist/mashroom-bootstrap2.js',
                    dependencies: [
                        'foo-services'
                    ],
                    name: 'Plugin 2',
                    type: 'plugin-loader'
                },
            ]
        });
        expect(pluginPackageDefinitions![0].meta).toEqual({
            author: 'Jürgen Kofler <juergen.kofler@nonblocking.at>',
            description: 'description test3',
            license: 'BSD-3-Clause',
            name: 'test1',
            version: '1.1.3'
        });
    });

    it('reads the plugin definition from /mashroom.json from a remote host', async () => {
        const remoteHost = new URL('http://my-remote-app.io:6068');

        nock(remoteHost.toString())
            .get('/package.json')
            .reply(200, {
                name: 'test2',
                version: '2.1.1',
            });
        nock(remoteHost.toString())
            .get('/mashroom.json')
            .reply(200, pluginsDefinition);

        const pluginDefinitionBuilder = new MashroomDefaultPluginPackageDefinitionBuilder({
            externalPluginConfigFileNames: ['mashroom']
        } as any, loggingUtils.dummyLoggerFactory);

        const pluginPackageDefinitions = await pluginDefinitionBuilder.buildDefinition(remoteHost, {});

        expect(pluginPackageDefinitions?.length).toBe(1);
        expect(pluginPackageDefinitions![0].packageURL).toBeTruthy();
        expect(pluginPackageDefinitions![0].definition).toEqual({
            plugins: [
                {
                    bootstrap: './dist/mashroom-bootstrap.js',
                    defaultConfig: {
                        foo: 'bar'
                    },
                    name: 'Plugin 1',
                    type: 'web-app'
                },
                {
                    bootstrap: './dist/mashroom-bootstrap2.js',
                    dependencies: [
                        'foo-services'
                    ],
                    name: 'Plugin 2',
                    type: 'plugin-loader'
                },
            ]
        });
        expect(pluginPackageDefinitions![0].meta).toEqual({
            name: 'test2',
            version: '2.1.1'
        });
    });

    it('reads the plugin definition from a custom file name from a remote host', async () => {
        const remoteHost = new URL('http://my-remote-app.io:6068');

        nock(remoteHost.toString())
            .get('/package.json')
            .reply(200, {
                name: 'test2',
                version: '2.1.1',
            });
        nock(remoteHost.toString())
            .get('/my-custom-plugin-definition-file-name.json')
            .reply(200, pluginsDefinition);

        const pluginDefinitionBuilder = new MashroomDefaultPluginPackageDefinitionBuilder({
            externalPluginConfigFileNames: ['mashroom']
        } as any, loggingUtils.dummyLoggerFactory);

        const pluginPackageDefinitions = await pluginDefinitionBuilder.buildDefinition(remoteHost, {
            'mashroom-server.com/remote-plugins-definition-path': '/my-custom-plugin-definition-file-name.json'
        });

        expect(pluginPackageDefinitions?.length).toBe(1);
        expect(pluginPackageDefinitions![0].packageURL).toBeTruthy();
        expect(pluginPackageDefinitions![0].definition).toEqual({
            plugins: [
                {
                    bootstrap: './dist/mashroom-bootstrap.js',
                    defaultConfig: {
                        foo: 'bar'
                    },
                    name: 'Plugin 1',
                    type: 'web-app'
                },
                {
                    bootstrap: './dist/mashroom-bootstrap2.js',
                    dependencies: [
                        'foo-services'
                    ],
                    name: 'Plugin 2',
                    type: 'plugin-loader'
                },
            ]
        });
        expect(pluginPackageDefinitions![0].meta).toEqual({
            name: 'test2',
            version: '2.1.1'
        });
    });

    it('reads the version from the build manifest on a remote host', async () => {
        const remoteHost = new URL('http://my-remote-app2.io:6068');

        nock(remoteHost.toString())
            .get('/package.json')
            .reply(404);
        nock(remoteHost.toString())
            .get('/buildManifest.json')
            .reply(200, {
                version: '5.2.2',
            });
        nock(remoteHost.toString())
            .get('/mashroom.json')
            .reply(200, pluginsDefinitionWithBuildManifest);

        const pluginDefinitionBuilder = new MashroomDefaultPluginPackageDefinitionBuilder({
            externalPluginConfigFileNames: ['mashroom']
        } as any, loggingUtils.dummyLoggerFactory);

        const pluginPackageDefinitions = await pluginDefinitionBuilder.buildDefinition(remoteHost, {});

        expect(pluginPackageDefinitions?.length).toBe(1);
        expect(pluginPackageDefinitions![0].meta).toEqual({
            name: 'my-remote-app2.io',
            version: '5.2.2',
            author: null,
            description: null,
            homepage: null,
            license: null,
        });
    });

    it('reads the plugin definition from /mashroom.yaml from a remote host', async () => {
        const remoteHost = new URL('http://my-remote-app.io:6068');

        nock(remoteHost.toString())
            .get('/package.json')
            .reply(200, {
                name: 'test2',
                version: '2.1.1',
            });
        nock(remoteHost.toString())
            .get('/mashroom.json')
            .reply(404);
        nock(remoteHost.toString())
            .get('/mashroom.yaml')
            .replyWithFile(200, resolve(__dirname, '../../../data/mashroom.yaml'));

        const pluginDefinitionBuilder = new MashroomDefaultPluginPackageDefinitionBuilder({
            externalPluginConfigFileNames: ['mashroom']
        } as any, loggingUtils.dummyLoggerFactory);

        const pluginPackageDefinitions = await pluginDefinitionBuilder.buildDefinition(remoteHost, {});

        expect(pluginPackageDefinitions?.length).toBe(1);
        expect(pluginPackageDefinitions![0].packageURL).toBeTruthy();
        expect(pluginPackageDefinitions![0].definition).toEqual({
            plugins: [
                {
                    bootstrap: './dist/mashroom-bootstrap.js',
                    defaultConfig: {
                        foo: 'bar'
                    },
                    name: 'Plugin 1',
                    type: 'web-app'
                },
                {
                    bootstrap: './dist/mashroom-bootstrap2.js',
                    dependencies: [
                        'foo-services'
                    ],
                    name: 'Plugin 2',
                    type: 'plugin-loader'
                },
            ]
        });
        expect(pluginPackageDefinitions![0].meta).toEqual({
            name: 'test2',
            version: '2.1.1'
        });
    });

    it('uses the scannerHints if no package.json can be found on a remote host', async () => {
        const remoteHost = new URL('http://my-remote-app.io:6068');

        nock(remoteHost.toString())
            .get('/package.json')
            .reply(404);
        nock(remoteHost.toString())
            .get('/mashroom.json')
            .reply(200, pluginsDefinition);

        const pluginDefinitionBuilder = new MashroomDefaultPluginPackageDefinitionBuilder({
            externalPluginConfigFileNames: ['mashroom']
        } as any, loggingUtils.dummyLoggerFactory);

        const pluginPackageDefinitions = await pluginDefinitionBuilder.buildDefinition(remoteHost, {
            packageName: 'test3',
            packageVersion: '3.1.1',
        });

        expect(pluginPackageDefinitions?.length).toBe(1);
        expect(pluginPackageDefinitions![0].packageURL).toBeTruthy();
        expect(pluginPackageDefinitions![0].definition).toEqual({
            plugins: [
                {
                    bootstrap: './dist/mashroom-bootstrap.js',
                    defaultConfig: {
                        foo: 'bar'
                    },
                    name: 'Plugin 1',
                    type: 'web-app'
                },
                {
                    bootstrap: './dist/mashroom-bootstrap2.js',
                    dependencies: [
                        'foo-services'
                    ],
                    name: 'Plugin 2',
                    type: 'plugin-loader'
                },
            ]
        });
        expect(pluginPackageDefinitions![0].meta).toEqual({
            name: 'test3',
            version: '3.1.1',
            author: null,
            description: null,
            homepage: null,
            license: null,
        });
    });

    it('accepts no package.json for a remote host', async () => {
        const remoteHost = new URL('http://my-remote-app.io:6068');

        nock(remoteHost.toString())
            .get('/package.json')
            .reply(404);
        nock(remoteHost.toString())
            .get('/mashroom.json')
            .reply(200, pluginsDefinition);

        const pluginDefinitionBuilder = new MashroomDefaultPluginPackageDefinitionBuilder({
            externalPluginConfigFileNames: ['mashroom']
        } as any, loggingUtils.dummyLoggerFactory);

        const pluginPackageDefinitions = await pluginDefinitionBuilder.buildDefinition(remoteHost, {});

        expect(pluginPackageDefinitions?.length).toBe(1);
        expect(pluginPackageDefinitions![0].packageURL).toBeTruthy();
        expect(pluginPackageDefinitions![0].definition).toEqual({
            plugins: [
                {
                    bootstrap: './dist/mashroom-bootstrap.js',
                    defaultConfig: {
                        foo: 'bar'
                    },
                    name: 'Plugin 1',
                    type: 'web-app'
                },
                {
                    bootstrap: './dist/mashroom-bootstrap2.js',
                    dependencies: [
                        'foo-services'
                    ],
                    name: 'Plugin 2',
                    type: 'plugin-loader'
                },
            ]
        });
        expect(pluginPackageDefinitions![0].meta.name).toBe('my-remote-app.io');
        expect(pluginPackageDefinitions![0].meta.version).toBeTruthy();
    });
});

