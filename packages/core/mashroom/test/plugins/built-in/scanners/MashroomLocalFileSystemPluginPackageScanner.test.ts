
import {resolve} from 'path';
import {ensureDirSync, emptyDirSync, writeJsonSync, removeSync} from 'fs-extra';
import {loggingUtils} from '@mashroom/mashroom-utils';
import defaultConfig from '../../../../src/config/mashroom-default-config';
import MashroomLocalFileSystemPluginPackageScanner from '../../../../src/plugins/built-in/scanners/MashroomLocalFileSystemPluginPackageScanner';
import type {URL} from 'url';

jest.setTimeout(10000);

const getPluginPackagesFolder = () => {
    const pluginsFolder = resolve(__dirname, '../../../../test-data/plugins1');
    emptyDirSync(pluginsFolder);

    const plugin1Folder = resolve(pluginsFolder, 'test1');
    ensureDirSync(plugin1Folder);
    const plugin2Folder = resolve(pluginsFolder, 'test2');
    ensureDirSync(plugin2Folder);
    const plugin3Folder = resolve(pluginsFolder, '.test3');
    ensureDirSync(plugin3Folder);
    writeJsonSync(resolve(plugin2Folder, 'package.json'), {
        name: 'test2',
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

    it('reports an update if an file changes', async () => {
        const pluginPackagesFolder = getPluginPackagesFolder();

        const config = { ...defaultConfig, pluginPackageFolders: [{path: pluginPackagesFolder, watch: true}] };

        const pluginPackageScanner = new MashroomLocalFileSystemPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);

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

        writeJsonSync(`${pluginPackagesFolder}/.test3/foo.json`, {foo: 2});
        writeJsonSync(`${pluginPackagesFolder}/test2/bar.json`, {bar: 1});

        await new Promise((resolve) => setTimeout(resolve, 3000));

        await pluginPackageScanner.stop();

        expect((updatedURL as any).pathname).toContain('test-data/plugins1/test2');
    });

    it('does not report an update if a file in an ignored folder changes', async () => {
        const pluginPackagesFolder = getPluginPackagesFolder();

        const config = { ...defaultConfig, pluginPackageFolders: [{path: pluginPackagesFolder, watch: true}] };

        const pluginPackageScanner = new MashroomLocalFileSystemPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);

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

        ensureDirSync(`${pluginPackagesFolder}/test2/dist`);
        writeJsonSync(`${pluginPackagesFolder}/test2/dist/bar.json`, {bar: 1});

        await new Promise((resolve) => setTimeout(resolve, 3000));

        await pluginPackageScanner.stop();

        expect(updatedURL).toBeFalsy();
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

        removeSync(`${pluginPackagesFolder  }/test2`);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        await pluginPackageScanner.stop();

        expect((removedURL as any).pathname).toContain('test-data/plugins1/test2');
    });

    it('reports an update if a file changes in a package folder that contains a package.json', async () => {
        const pluginPackagesFolder = resolve(getPluginPackagesFolder(), 'test2');

        const config = {...defaultConfig, pluginPackageFolders: [{path: pluginPackagesFolder, watch: true}]};

        const pluginPackageScanner = new MashroomLocalFileSystemPluginPackageScanner(config, loggingUtils.dummyLoggerFactory);

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

        writeJsonSync(`${pluginPackagesFolder}/foo.json`, {foo: 2});

        await new Promise((resolve) => setTimeout(resolve, 5000));

        await pluginPackageScanner.stop();

        expect((updatedURL as any).pathname).toContain('test-data/plugins1/test2');
    });

    it('doesnt scan subfolders if the package folder contains a package.json', async () => {
        const pluginPackagesFolder = resolve(getPluginPackagesFolder(), 'test2');

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

});

