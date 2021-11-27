
import {engine} from 'express-handlebars';
import path from 'path';
import helpers from './handlebar_helpers';
import themeParams from './theme_params';

import type {MashroomPortalThemePluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalThemePluginBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    const { spaMode, showPortalAppHeaders, showEnvAndVersions } = pluginConfig;
    themeParams.setParams({
        spaMode,
        showPortalAppHeaders,
        showEnvAndVersions,
        mashroomVersion: contextHolder.getPluginContext().serverInfo.version,
    });

    return {
        engineName: 'handlebars',
        engineFactory: () => {
            return engine({
                helpers,
                partialsDir: path.resolve(__dirname, '../views/partials/'),
                defaultLayout: '',
            });
        },
    };
};


export default bootstrap;
