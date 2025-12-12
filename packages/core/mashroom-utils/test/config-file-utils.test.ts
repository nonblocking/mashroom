import {resolve} from 'path';
import {loadConfigFile} from '../src/config-file-utils';

describe('onfig-file-utils.loadConfigFile', () => {

    it('loads a JSON config file', async () => {
        const config = await loadConfigFile(resolve(__dirname, 'data/mashroom.json'));
        expect(config).toBeTruthy();
        expect(config.name).toBe('Mashroom Test Server 1');
    });

    it('loads a YAML config file', async () => {
        const config = await loadConfigFile(resolve(__dirname, 'data/mashroom.yaml'));
        expect(config).toBeTruthy();
        expect(config.name).toBe('Mashroom Test Server 1');
    });

    it.skip('loads an ESM JS config file', async () => {
        const config = await loadConfigFile(resolve(__dirname, 'data/mashroom.mjs'));
        expect(config).toBeTruthy();
        expect(config.name).toBe('Mashroom Test Server 1');
    });

    it.skip('loads TypeScript config file', async () => {
        const config = await loadConfigFile(resolve(__dirname, 'data/mashroom.ts'));
        expect(config).toBeTruthy();
        expect(config.name).toBe('Mashroom Test Server 1');
    });

});
