
import {resolve} from 'path';
import {pathToFileURL} from 'url';
import {ensureDirSync, emptyDirSync, writeJsonSync, writeFileSync} from 'fs-extra';
import {loggingUtils} from '@mashroom/mashroom-utils';
import MashroomDefaultPluginPackageDefinitionBuilder from '../../../../src/plugins/built-in/definitions/MashroomDefaultPluginPackageDefinitionBuilder';

const getPluginPackagesFolder = () => {
    const pluginsFolder = resolve(__dirname, '../../../../test-data/plugins2');
    emptyDirSync(pluginsFolder);

    const plugin1Folder = resolve(pluginsFolder, 'test1');
    ensureDirSync(plugin1Folder);
    const plugin2Folder = resolve(pluginsFolder, 'test2');
    ensureDirSync(plugin2Folder);
    writeJsonSync(resolve(plugin1Folder, 'package.json'), {
        name: 'test1',
        description: 'description test3',
        version: '1.1.3',
        license: 'BSD-3-Clause',
        author: 'Jürgen Kofler <juergen.kofler@nonblocking.at>',
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
            ],
        },
    });
    writeJsonSync(resolve(plugin2Folder, 'package.json'), {
        name: 'test2',
        version: '2.1.1',
    });
    writeFileSync(resolve(plugin2Folder, 'mashroom.js'), `
        module.exports.default = {
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
    `);
    return pluginsFolder;
};

describe('MashroomDefaultPluginPackageDefinitionBuilder', () => {

    it('reads the plugin definition from package.json', async () => {
        const pluginPackagesFolder1 = resolve(getPluginPackagesFolder(), 'test1');

        const pluginDefinitionBuilder = new MashroomDefaultPluginPackageDefinitionBuilder({
            externalPluginConfigFileNames: ['mashroom']
        } as any, loggingUtils.dummyLoggerFactory);

        const pluginPackageDefinition = await pluginDefinitionBuilder.buildDefinition(pathToFileURL(pluginPackagesFolder1));

        expect(pluginPackageDefinition).toEqual({
            definition: {
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
            },
            meta: {
                author: 'Jürgen Kofler <juergen.kofler@nonblocking.at>',
                description: 'description test3',
                license: 'BSD-3-Clause',
                name: 'test1',
                version: '1.1.3'
            }
        });
    });

    it('reads the plugin definition from mashroom.json', async () => {
        const pluginPackagesFolder2 = resolve(getPluginPackagesFolder(), 'test2');

        const pluginDefinitionBuilder = new MashroomDefaultPluginPackageDefinitionBuilder({
            externalPluginConfigFileNames: ['mashroom']
        } as any, loggingUtils.dummyLoggerFactory);

        const pluginPackageDefinition = await pluginDefinitionBuilder.buildDefinition(pathToFileURL(pluginPackagesFolder2));

        expect(pluginPackageDefinition).toEqual({
            definition: {
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
            },
            meta: {
                name: 'test2',
                version: '2.1.1'
            }
        });
    });
});

