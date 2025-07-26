import {loggingUtils} from '@mashroom/mashroom-utils';
import fixAndValidatePluginPackageDefinition from '../../../src/plugins/validation/fixAndValidatePluginPackageDefinition';

const packageURL = new URL('file:///foo/bar');

describe('fixAndValidatePluginPackageDefinition', () => {

    it('fails with a missing package name', async () => {
        expect(() => fixAndValidatePluginPackageDefinition(packageURL, {
        } as any, {
            version: '1.0.0',
        } as any,
            loggingUtils.dummyLoggerFactory())).toThrow('Invalid package definition: No name property!');
    });

    it('fails with a missing package version', async () => {
        expect(() => fixAndValidatePluginPackageDefinition(packageURL, {
            } as any, {
                name: 'test',
            } as any,
            loggingUtils.dummyLoggerFactory())).toThrow('Invalid package definition: No version property!');
    });

    it('fails with a plugin definition without a name', async () => {
        expect(() => fixAndValidatePluginPackageDefinition(packageURL, {
                plugins: [{

                }]
            } as any, {
                name: 'test',
                version: '1.0.0',
            } as any,
            loggingUtils.dummyLoggerFactory())).toThrow('Plugin without a name property found!');
    });

    it('fails with a plugin definition with an invalid name', async () => {
        expect(() => fixAndValidatePluginPackageDefinition(packageURL, {
                plugins: [{
                    name: 'plugin?',
                }]
            } as any, {
                name: 'test',
                version: '1.0.0',
            } as any,
            loggingUtils.dummyLoggerFactory())).toThrow('Plugin name \'plugin?\' has invalid characters (/,?)!');
    });

    it('fails with a plugin definition without a type', async () => {
        expect(() => fixAndValidatePluginPackageDefinition(packageURL, {
                plugins: [{
                    name: 'test',
                    description: 'test',
                }]
            } as any, {
                name: 'test',
                version: '1.0.0',
            } as any,
            loggingUtils.dummyLoggerFactory())).toThrow('Plugin \'test\' has no type property!');
    });

    it('fails with duplicate plugin names', async () => {
        expect(() => fixAndValidatePluginPackageDefinition(packageURL, {
                plugins: [{
                    name: 'test1',
                    type: 'test',
                }, {
                    name: 'test2',
                    type: 'test',
                }, {
                    name: 'test1',
                    type: 'test',
                }]
            } as any, {
                name: 'test',
                version: '1.0.0',
            } as any,
            loggingUtils.dummyLoggerFactory())).toThrow('Duplicate plugin \'test1\' found!');
    });

    it('fixes the description field of plugins', async () => {
        const fixed = fixAndValidatePluginPackageDefinition(packageURL, {
                plugins: [{
                    name: 'test',
                    type: 'foo',
                }]
            } as any, {
                name: 'test',
                version: '1.0.0',
                description: 'the description',
            } as any,
            loggingUtils.dummyLoggerFactory());

        expect(fixed.plugins[0].description).toBe('the description');
    });

    it('evaluates templates in the config object', async () => {
        process.env.SERVER_NAME = 'The Server';

        const fixed = fixAndValidatePluginPackageDefinition(packageURL, {
                plugins: [{
                    name: 'test',
                    type: 'foo',
                    defaultConfig: {
                        foo: 'Hello from ${env.SERVER_NAME}!',
                    }
                }]
            } as any, {
                name: 'test',
                version: '1.0.0',
            } as any,
            loggingUtils.dummyLoggerFactory());

        expect(fixed.plugins[0].defaultConfig?.foo).toBe('Hello from The Server!');
    });
});
