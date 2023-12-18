
import {resolve} from 'path';

import {loggingUtils} from '@mashroom/mashroom-utils';
import NxUtils from '../../../src/plugins/building/NxUtils';

jest.setTimeout(60000);

describe('NxUtils', () => {

    it('finds nx if available', async () => {
        const packageFolder = resolve(__dirname, '../../..');
        const nxUtils = new NxUtils(loggingUtils.dummyLoggerFactory);
        expect(await nxUtils.isNxAvailable(packageFolder)).toBeTruthy();
    });

    it('runs build scripts', async () => {
        const packageFolder = resolve(__dirname, '../../..');
        const nxUtils = new NxUtils(loggingUtils.dummyLoggerFactory);
        await nxUtils.runScript(packageFolder, 'build');
    });

});
