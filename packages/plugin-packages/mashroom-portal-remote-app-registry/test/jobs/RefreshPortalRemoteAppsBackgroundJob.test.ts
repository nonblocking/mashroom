
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging-utils';
import RefreshPortalRemoteAppsBackgroundJob from '../../src/js/jobs/RefreshPortalRemoteAppsBackgroundJob';
import context from '../../src/js/context';

describe('RefreshPortalRemoteAppsBackgroundJob', () => {

    it('refreshes endpoints correctly', async () => {
        const mockUpdateOne = jest.fn();
        const mockAddOrUpdatePackageURL = jest.fn();

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

        context.scannerCallback = {
            addOrUpdatePackageURL: mockAddOrUpdatePackageURL,
            removePackageURL: () => {},
        };

        const backgroundJob = new RefreshPortalRemoteAppsBackgroundJob(10, pluginContextHolder);
        await backgroundJob.run();

        expect(mockUpdateOne).toHaveBeenCalledTimes(1);
        expect(mockAddOrUpdatePackageURL).toHaveBeenCalledTimes(1);
        expect(mockAddOrUpdatePackageURL.mock.calls[0][0].toString()).toBe('https://microfrontend1.myserver.com/');
    });

});
