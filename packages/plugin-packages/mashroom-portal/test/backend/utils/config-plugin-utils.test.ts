import {getConfigPluginWithOverwriteProxyTargetUrl} from '../../../src/backend/utils/config-plugin-utils';

describe('config-plugin-utils', () => {

    it('considers the order property of the plugin', async () => {
        const pluginRegistry: any = {
            portalAppConfigs: [{
                name: '1',
                order: 100,
                plugin: {
                    applyTo: () => true,
                    overwriteProxyTargetUrl: () => {},
                }
            }, {
                name: '2',
                order: 200,
                plugin: {
                    applyTo: () => true,
                }
            }, {
                name: '3',
                order: 10,
                plugin: {
                    applyTo: () => true,
                    overwriteProxyTargetUrl: () => {},
                }
            }]
        };

        const plugin = getConfigPluginWithOverwriteProxyTargetUrl('Portal App 1', pluginRegistry);

        expect(plugin).toBeTruthy();
        expect(plugin!.name).toBe('3');
    });

});
