
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging-utils';
import RefreshRemotePluginPackagesBackgroundJob from '../../src/js/jobs/RefreshRemotePluginPackagesBackgroundJob';
import context from '../../src/js/context';

describe('RefreshRemotePluginPackagesBackgroundJob', () => {

    it('refreshes endpoints correctly', async () => {
        const mockUpdateOne = jest.fn();
        const scannerCallback = {
            addOrUpdatePackageUrl: jest.fn(),
            removePackageUrl: jest.fn()
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
                                        url: 'https://microfrontend1.myserver.com',
                                        lastRefreshTimestamp: Date.now() - 11000
                                    }, {
                                        url: 'https://microfrontend55.myserver.com',
                                        lastRefreshTimestamp: Date.now() - 9000,
                                    }],
                                };
                            },
                            updateOne: mockUpdateOne,
                        }),
                    }
                }
            }
        };
        const pluginContextHolder = {
            getPluginContext: () => pluginContext,
        };

        const backgroundJob = new RefreshRemotePluginPackagesBackgroundJob(10, pluginContextHolder);
        await backgroundJob.run();

        expect(mockUpdateOne).toHaveBeenCalledTimes(1);
        expect(scannerCallback.addOrUpdatePackageUrl).toHaveBeenCalledTimes(1);
        expect(scannerCallback.addOrUpdatePackageUrl.mock.calls[0][0].toString()).toBe('https://microfrontend1.myserver.com/');
    });

});
