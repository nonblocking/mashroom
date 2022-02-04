
import {createEngine} from 'express-react-views';
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
            return createEngine({
                transformViews: false,
            });
        },
    };
};

export default bootstrap;
