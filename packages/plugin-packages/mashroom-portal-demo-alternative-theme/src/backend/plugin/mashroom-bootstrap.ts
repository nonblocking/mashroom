
import engine from './react_engine';
import themeParams from './theme_params';

import type {MashroomPortalThemePluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalThemePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {serverInfo} = pluginContextHolder.getPluginContext();
    themeParams.setParams({
        mashroomVersion: serverInfo.version,
    });

    return {
        engineName: 'js',
        engineFactory: () => {
            return engine;
        },
    };
};

export default bootstrap;
