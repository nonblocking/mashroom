
import {existsSync} from 'fs';
import {resolve} from 'path';
import {emptyDirSync, writeJsonSync} from 'fs-extra';

import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import NpmUtils from '../../../src/plugins/building/NpmUtils';

jest.setTimeout(60000);

const getTestPackageFolder = () => {
    const packageFolder = resolve(__dirname, '../../../test-data/test-package1');
    emptyDirSync(packageFolder);
    writeJsonSync(resolve(packageFolder, 'package.json'), {
        name: 'test1',
        version: '1.0.0',
        dependencies: {
            copyfiles: '^1',
        },
        scripts: {
            build: 'copyfiles package.json package-copy.json',
        },
    });
    return packageFolder;
};


describe('NpmUtils', () => {

    it('detects correctly if a given package is root (and not part of a mono-repo)', async () => {
        const mashroomCorePackageFolder = resolve(__dirname, '../../..');
        const mashroomPackageFolder = resolve(mashroomCorePackageFolder, '../../..');

        const npmUtils = new NpmUtils(dummyLoggerFactory);

        expect(npmUtils.isRootPackage(mashroomCorePackageFolder)).toBeFalsy();
        expect(npmUtils.isRootPackage(mashroomPackageFolder)).toBeTruthy();
    });


    it('installs the prod and dev dependencies in package.json', async () => {
        const packageFolder = getTestPackageFolder();
        const npmUtils = new NpmUtils(dummyLoggerFactory);

        await npmUtils.install(packageFolder);

        expect(existsSync(resolve(packageFolder, 'node_modules'))).toBeTruthy();
    });

    it('installs the prod and dev dependencies in package.json and runs the build script', async () => {
        const packageFolder = getTestPackageFolder();
        const npmUtils = new NpmUtils(dummyLoggerFactory);

        await npmUtils.install(packageFolder);
        await npmUtils.runScript(packageFolder, 'build');

        expect(existsSync(resolve(packageFolder, 'package-copy.json'))).toBeTruthy();
    });

});
