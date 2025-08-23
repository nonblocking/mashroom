
import {loggingUtils} from '@mashroom/mashroom-utils';
import MashroomPluginService from '../../src/services/MashroomPluginService';

describe('MashroomPluginService', () => {

    it('fires and removes onLoaded listeners', (done) => {

        let loadedHandler: any = null;
        const pluginRegistry: any = {
            on(eventName: string, handler: any) {
                if (eventName === 'loaded') {
                    loadedHandler = handler;
                }
            }
        };

        const pluginService = new MashroomPluginService(pluginRegistry, loggingUtils.dummyLoggerFactory);

        pluginService.onLoadedOnce('test-plugin', () => {
            setTimeout(() => {
                // @ts-ignore
                expect(Object.keys(pluginService._loadedListeners).length).toBe(0);
                done();
            }, 0);
        });

        if (loadedHandler) {
            loadedHandler({
                pluginName: 'test-plugin',
            });
        }
    });

    it('fires and removes unUnload listeners', (done) => {

        let unloadHandler: any = null;
        const pluginRegistry: any = {
            on(eventName: string, handler: any) {
                if (eventName === 'unloaded') {
                    unloadHandler = handler;
                }
            }
        };

        const pluginService = new MashroomPluginService(pluginRegistry, loggingUtils.dummyLoggerFactory);

        pluginService.onUnloadOnce('test-plugin', () => {
            setTimeout(() => {
                // @ts-ignore
                expect(Object.keys(pluginService._unloadListeners).length).toBe(0);
                done();
            }, 0);
        });

        if (unloadHandler) {
            unloadHandler({
                pluginName: 'test-plugin',
            });
        }
    });

});
