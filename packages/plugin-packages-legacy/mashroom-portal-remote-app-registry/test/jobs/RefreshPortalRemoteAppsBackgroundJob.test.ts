
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging-utils';
import RefreshPortalRemoteAppsBackgroundJob from '../../src/js/jobs/RefreshPortalRemoteAppsBackgroundJob';
import context from '../../src/js/context';

describe('RefreshPortalRemoteAppsBackgroundJob', () => {

    it('refreshes endpoints correctly', async () => {
        const mockUpdateOne = jest.fn();
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

        const backgroundJob = new RefreshPortalRemoteAppsBackgroundJob(10, pluginContextHolder);
        await backgroundJob.run();

        expect(mockUpdateOne).toHaveBeenCalledTimes(1);
        expect(scannerCallback.addOrUpdatePackageURL).toHaveBeenCalledTimes(1);
        expect(scannerCallback.addOrUpdatePackageURL.mock.calls[0][0].toString()).toBe('https://microfrontend1.myserver.com/');
    });

});
