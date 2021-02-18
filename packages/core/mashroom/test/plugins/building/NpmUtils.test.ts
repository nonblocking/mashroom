
import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';

import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import NpmUtils from '../../../src/plugins/building/NpmUtils';

jest.setTimeout(60000);

const getTestPackageFolder = () => {
    const packageFolder = path.resolve(__dirname, '../../../test-data/test-package1');
    fsExtra.emptyDirSync(packageFolder);
    fsExtra.writeJsonSync(path.resolve(packageFolder, 'package.json'), {
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

    it('installs the prod and dev dependencies in package.json', async () => {
        const packageFolder = getTestPackageFolder();
        const npmUtils = new NpmUtils(dummyLoggerFactory);

        await npmUtils.install(packageFolder);

        expect(fs.existsSync(path.resolve(packageFolder, 'node_modules'))).toBeTruthy();
    });

    it('installs the prod and dev dependencies in package.json and runs the build script', async () => {
        const packageFolder = getTestPackageFolder();
        const npmUtils = new NpmUtils(dummyLoggerFactory);

        await npmUtils.install(packageFolder);
        await npmUtils.runScript(packageFolder, 'build');

        expect(fs.existsSync(path.resolve(packageFolder, 'package-copy.json'))).toBeTruthy();
    });

});
