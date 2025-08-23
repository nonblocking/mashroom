
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging-utils';
import RemotePluginPackagesScanner from '../../src/js/scanner/RemotePluginPackagesScanner';
import context from '../../src/js/context';

describe('RemotePluginPackagesScanner', () => {

    it('performs an initial scan at startup', async () => {
        const mockUpdateOne = jest.fn();
        const mockInsertOne = jest.fn();
        const scannerCallback = {
            addOrUpdatePackageURL: jest.fn(),
            removePackageURL: jest.fn()
        };
        context.scannerCallback = scannerCallback;

        const pluginContext: any = {
            loggerFactory: dummyLoggerFactory,
            services: {
                storage: {
                    service: {
                        getCollection: () => ({
                            find: async() => {
                                return {
                                    result: [{
                                        url: 'https://microfrontend1.myserver.com/',
                                        lastRefreshTimestamp: 0,
                                    }, {
                                        url: 'https://microfrontend55.myserver.com/',
                                        lastRefreshTimestamp: 0,
                                    }],
                                };
                            },
                            updateOne: mockUpdateOne,
                            insertOne: mockInsertOne,
                        }),
                    }
                }
            }
        };
        const pluginContextHolder = {
            getPluginContext: () => pluginContext,
        };

        mockInsertOne.mockImplementation((endpoint) => Promise.resolve(endpoint));

        const scanner = new RemotePluginPackagesScanner('dummyConfig.json', __dirname, pluginContextHolder);
        await scanner.start();

        expect(mockInsertOne).toHaveBeenCalledTimes(1);
        expect(mockUpdateOne).toHaveBeenCalledTimes(1);
        expect(scannerCallback.addOrUpdatePackageURL).toHaveBeenCalledTimes(3);
        expect(scannerCallback.addOrUpdatePackageURL.mock.calls[0][0].toString()).toBe('https://microfrontend1.myserver.com/');
        expect(scannerCallback.addOrUpdatePackageURL.mock.calls[1][0].toString()).toBe('https://microfrontend55.myserver.com/');
        expect(scannerCallback.addOrUpdatePackageURL.mock.calls[2][0].toString()).toBe('https://microfrontend2.myserver.com/');
    });

    it('ignores invalid URLs', async () => {
        const mockUpdateOne = jest.fn();
        const mockInsertOne = jest.fn();
        const scannerCallback = {
            addOrUpdatePackageURL: jest.fn(),
            removePackageURL: jest.fn()
        };
        context.scannerCallback = scannerCallback;

        const pluginContext: any = {
            loggerFactory: dummyLoggerFactory,
            services: {
                storage: {
                    service: {
                        getCollection: () => ({
                            find: async() => {
                                return {
                                    result: [],
                                };
                            },
                            updateOne: mockUpdateOne,
                            insertOne: mockInsertOne,
                        }),
                    }
                }
            }
        };
        const pluginContextHolder = {
            getPluginContext: () => pluginContext,
        };

        mockInsertOne.mockImplementation((endpoint) => Promise.resolve(endpoint));

        const scanner = new RemotePluginPackagesScanner('dummyConfigInvalid.json', __dirname, pluginContextHolder);
        await scanner.start();

        expect(mockInsertOne).toHaveBeenCalledTimes(1);
        expect(mockUpdateOne).toHaveBeenCalledTimes(0);
        expect(scannerCallback.addOrUpdatePackageURL).toHaveBeenCalledTimes(1);
        expect(scannerCallback.addOrUpdatePackageURL.mock.calls[0][0].toString()).toBe('https://microfrontend1.myserver.com/');
    });

});
