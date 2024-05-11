
import path from 'path';
import fsExtra from 'fs-extra';
import {loggingUtils} from '@mashroom/mashroom-utils';
import defaultConfig from '../../../src/config/mashroom-default-config';
import MashroomPluginPackageScanner from '../../../src/plugins/scanner/MashroomPluginPackageScanner';

const getPluginPackagesFolder = () => {
    const pluginsFolder = path.resolve(__dirname, '../../../test-data/plugins1');
    fsExtra.emptyDirSync(pluginsFolder);
    const plugin1Folder = path.resolve(pluginsFolder, 'test1');
    fsExtra.ensureDirSync(plugin1Folder);
    const plugin2Folder = path.resolve(pluginsFolder, 'test2');
    fsExtra.ensureDirSync(plugin2Folder);
    const plugin3Folder = path.resolve(pluginsFolder, '.test3');
    fsExtra.ensureDirSync(plugin3Folder);
    fsExtra.writeJsonSync(path.resolve(plugin1Folder, 'package.json'), {
        name: 'test1',
        mashroom: {},
    });
    fsExtra.writeJsonSync(path.resolve(plugin2Folder, 'package.json'), {
        name: 'test2',
        mashroom: {},
    });
    fsExtra.writeJsonSync(path.resolve(plugin3Folder, 'package.json'), {
        name: 'test3',
        mashroom: {},
    });
    return pluginsFolder;
};

describe('MashroomPluginPackageScanner', () => {

    it('scans all subfolders on start', async () => {
        const config = { ...defaultConfig, pluginPackageFolders: [{path: getPluginPackagesFolder(), watch: true}] };

        const foundPaths = [];

        const pluginPackageScanner = new MashroomPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);
        pluginPackageScanner.on('packageAdded', (path) => {
            foundPaths.push(path);
        });

        await pluginPackageScanner.start();
        await new Promise((resolve) => setTimeout(resolve, 500));

        await pluginPackageScanner.stop();
        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(foundPaths.length).toBe(2);
    });

    it('fires an update event if a file changes', (done) => {
        const pluginPackagesFolder = getPluginPackagesFolder();

        const config = { ...defaultConfig, pluginPackageFolders: [{path: pluginPackagesFolder, watch: true}] };

        const pluginPackageScanner = new MashroomPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);

        // @ts-ignore
        pluginPackageScanner._deferUpdateMillis = 100;

        pluginPackageScanner.start().then(() => {
            pluginPackageScanner.on('packageUpdated', (packagePath) => {
                pluginPackageScanner.stop();
                if (packagePath === `${pluginPackagesFolder + path.sep}test2`) {
                    done();
                } else {
                   fail(`Invalid path: ${packagePath}`);
                }
            });

            setTimeout(() => {
                fsExtra.writeJsonSync(`${pluginPackagesFolder}/.test3/foo.json`, {'foo': 2});
                fsExtra.writeJsonSync(`${pluginPackagesFolder}/test2/bar.json`, {'bar': 1});
            }, 1000);
        });
    });

    it('fires a remove event if package.json has no longer a "mashroom" property', (done) => {
        const pluginPackagesFolder = getPluginPackagesFolder();

        const config = { ...defaultConfig, pluginPackageFolders: [{path: pluginPackagesFolder, watch: true}] };

        const pluginPackageScanner = new MashroomPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);

        pluginPackageScanner.on('packageRemoved', (packagePath) => {
            pluginPackageScanner.stop();
            if (packagePath === `${pluginPackagesFolder + path.sep}test2`) {
                done();
            } else {
                fail(`Invalid path: ${packagePath}`);
            }
        });

        pluginPackageScanner.start().then(() => {
            setTimeout(() => {
                fsExtra.writeJsonSync(`${pluginPackagesFolder  }/test2/package.json`, {'name': 'test3'});
            }, 1000);
        });
    });

    it('doesnt scan subfolders if the package folder contains a package.json itself', (done) => {
        const pluginPackagesFolder = path.resolve(getPluginPackagesFolder(), 'test2');

        const config = { ...defaultConfig, pluginPackageFolders: [{path: pluginPackagesFolder, watch: false}] };

        const foundPaths = [];

        const pluginPackageScanner = new MashroomPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);
        pluginPackageScanner.on('packageAdded', (path) => {
            foundPaths.push(path);
            if (foundPaths.length === 1) {
                pluginPackageScanner.stop();
                done();
            }
        });

        pluginPackageScanner.start();
    });

    it('fires an update event if a file changes in a package folder that contains a package.json itself', (done) => {
        const pluginPackagesFolder = path.resolve(getPluginPackagesFolder(), 'test2');

        const config = { ...defaultConfig, pluginPackageFolders: [{path: pluginPackagesFolder, watch: true}] };

        const pluginPackageScanner = new MashroomPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);
        // @ts-ignore
        pluginPackageScanner._deferUpdateMillis = 500;

        pluginPackageScanner.on('packageUpdated', (packagePath) => {
            pluginPackageScanner.stop();
            if (packagePath === pluginPackagesFolder) {
                done();
            } else {
                fail(`Invalid path: ${packagePath}`);
            }
        });

        pluginPackageScanner.start().then(() => {
            setTimeout(() => {
                fsExtra.writeJsonSync(`${pluginPackagesFolder}/foo.json`, {'foo': 2});
            }, 1000);
        });
    });

});

