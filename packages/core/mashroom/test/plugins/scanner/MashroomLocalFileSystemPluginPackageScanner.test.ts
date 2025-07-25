
import path from 'path';
import fsExtra from 'fs-extra';
import {loggingUtils} from '@mashroom/mashroom-utils';
import defaultConfig from '../../../src/config/mashroom-default-config';
import MashroomLocalFileSystemPluginPackageScanner from '../../../src/plugins/scanner/MashroomLocalFileSystemPluginPackageScanner';
import type {URL} from 'url';

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

describe('MashroomLocalFileSystemPluginPackageScanner', () => {

    it('scans all subfolders on start', async () => {
        const config = { ...defaultConfig, pluginPackageFolders: [{path: getPluginPackagesFolder(), watch: true}] };

        const foundURLs = [];

        const pluginPackageScanner = new MashroomLocalFileSystemPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);
        pluginPackageScanner.setCallback({
            addOrUpdatePackageURL(url: URL) {
                foundURLs.push(url);
            },
            removePackageURL(url: URL) {
            }
        });

        await pluginPackageScanner.start();
        await new Promise((resolve) => setTimeout(resolve, 500));

        await pluginPackageScanner.stop();
        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(foundURLs.length).toBe(2);
    });

    it('reports an updated if an file changes', async () => {
        const pluginPackagesFolder = getPluginPackagesFolder();

        const config = { ...defaultConfig, pluginPackageFolders: [{path: pluginPackagesFolder, watch: true}] };

        const pluginPackageScanner = new MashroomLocalFileSystemPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);

        // @ts-ignore
        pluginPackageScanner._deferUpdateMillis = 100;

        let updatedURL: URL | undefined;
        pluginPackageScanner.setCallback({
            addOrUpdatePackageURL(url: URL) {
                updatedURL = url;
            },
            removePackageURL(url: URL) {
            }
        });

        await pluginPackageScanner.start();

        await new Promise((resolve) => setTimeout(resolve, 1000));
        updatedURL = undefined;

        fsExtra.writeJsonSync(`${pluginPackagesFolder}/.test3/foo.json`, {foo: 2});
        fsExtra.writeJsonSync(`${pluginPackagesFolder}/test2/bar.json`, {bar: 1});

        await new Promise((resolve) => setTimeout(resolve, 3000));

        await pluginPackageScanner.stop();

        expect((updatedURL as any).pathname).toContain('test-data/plugins1/test2');
    });

    it('reports folder removal', async () => {
        const pluginPackagesFolder = getPluginPackagesFolder();

        const config = { ...defaultConfig, pluginPackageFolders: [{path: pluginPackagesFolder, watch: true}] };

        const pluginPackageScanner = new MashroomLocalFileSystemPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);

        let removedURL: URL | undefined;
        pluginPackageScanner.setCallback({
            addOrUpdatePackageURL(url: URL) {
            },
            removePackageURL(url: URL) {
                removedURL= url;
            }
        });

        await pluginPackageScanner.start();

        await new Promise((resolve) => setTimeout(resolve, 1000));

        fsExtra.removeSync(`${pluginPackagesFolder  }/test2`);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        await pluginPackageScanner.stop();

        expect((removedURL as any).pathname).toContain('test-data/plugins1/test2');
    });

    it('doesnt scan subfolders if the package folder contains a package.json', async () => {
        const pluginPackagesFolder = path.resolve(getPluginPackagesFolder(), 'test2');

        const config = { ...defaultConfig, pluginPackageFolders: [{path: pluginPackagesFolder, watch: false}] };

        const foundURLs: Array<URL> = [];

        const pluginPackageScanner = new MashroomLocalFileSystemPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);
        pluginPackageScanner.setCallback({
            addOrUpdatePackageURL(url: URL) {
                foundURLs.push(url);
            },
            removePackageURL(url: URL) {
            }
        });

        await pluginPackageScanner.start();

        await new Promise((resolve) => setTimeout(resolve, 1000));

        await pluginPackageScanner.stop();

        expect(foundURLs.length).toBe(1);
        expect(foundURLs[0].pathname.endsWith('test-data/plugins1/test2')).toBeTruthy();
    });

    it('reports an update if a file changes in a package folder that contains a package.json', async () => {
        const pluginPackagesFolder = path.resolve(getPluginPackagesFolder(), 'test2');

        const config = {...defaultConfig, pluginPackageFolders: [{path: pluginPackagesFolder, watch: true}]};

        const pluginPackageScanner = new MashroomLocalFileSystemPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);
        // @ts-ignore
        pluginPackageScanner._deferUpdateMillis = 500;

        let updatedURL: URL | undefined;
        pluginPackageScanner.setCallback({
            addOrUpdatePackageURL(url: URL) {
                updatedURL = url;
            },
            removePackageURL(url: URL) {
            }
        });

        await pluginPackageScanner.start();

        await new Promise((resolve) => setTimeout(resolve, 1000));
        updatedURL = undefined;

        fsExtra.writeJsonSync(`${pluginPackagesFolder}/foo.json`, {foo: 2});

        await new Promise((resolve) => setTimeout(resolve, 3000));

        await pluginPackageScanner.stop();

        expect((updatedURL as any).pathname).toContain('test-data/plugins1/test2');
    });
});

