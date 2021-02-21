
import PluginConfigurationError from '@mashroom/mashroom-utils/lib/PluginConfigurationError';

import type {
    MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig,
    MashroomPluginContextHolder, MashroomLoggerFactory, MashroomLogger
} from '../../../type-definitions';

export default class MashroomAdminUIIntegrationLoader implements MashroomPluginLoader {

    private logger: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.plugins.loader');
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {
            height: '80vh',
            weight: 100,
        };
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const {target} = plugin.pluginDefinition;
        const {menuTitle, path} = config;
        if (!target) {
            throw new PluginConfigurationError(`Cannot register Admin UI integration ${plugin.name} because the 'target' attribute is missing!`);
        }
        if (!menuTitle) {
            throw new PluginConfigurationError(`Cannot register Admin UI integration ${plugin.name} because the 'menuTitle' config attribute is missing!`);
        }
        if (!path) {
            throw new PluginConfigurationError(`Cannot register Admin UI integration ${plugin.name} because the 'path' config attribute is missing!`);
        }
        this.logger.info('Registering Admin UI integration:', plugin.name);
    }

    async unload(plugin: MashroomPlugin) {
        this.logger.info('Unregistering Admin UI integration:', plugin.name);
    }

    get name(): string {
        return 'Admin UI Integration Plugin Loader';
    }

}
