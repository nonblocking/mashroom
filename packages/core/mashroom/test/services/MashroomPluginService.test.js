// @flow

import MashroomPluginService from '../../src/services/MashroomPluginService';

describe('MashroomPluginService', () => {

    it('fires and removes onLoaded listeners', (done) => {

        let loadedHandler = null;
        const pluginRegistry: any = {
            on(eventName, handler) {
                if (eventName === 'loaded') {
                    loadedHandler = handler;
                }
            }
        };

        const pluginService = new MashroomPluginService(pluginRegistry);

        pluginService.onLoadedOnce('test-plugin', () => {
            setTimeout(() => {
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

        let unloadHandler = null;
        const pluginRegistry: any = {
            on(eventName, handler) {
                if (eventName === 'unload') {
                    unloadHandler = handler;
                }
            }
        };

        const pluginService = new MashroomPluginService(pluginRegistry);

        pluginService.onUnloadOnce('test-plugin', () => {
            setTimeout(() => {
                expect(Object.keys(pluginService._loadedListeners).length).toBe(0);
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
