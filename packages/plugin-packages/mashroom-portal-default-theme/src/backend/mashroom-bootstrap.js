// @flow

import exphbs from 'express-handlebars';
import path from 'path';
import helpers from './handlebar_helpers';
import context from './context';

import type {MashroomPortalThemePluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalThemePluginBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    const { showEnvAndVersions } = pluginConfig;
    context.setContext({
        showEnvAndVersions,
        mashroomVersion: contextHolder.getPluginContext().serverInfo.version,
    });

    return {
        engineName: 'handlebars',
        engineFactory: () => {
            const hbs = exphbs.create({
                helpers,
                partialsDir: path.resolve(__dirname, '../views/partials/'),
            });
            return hbs.engine;
        },
    };
};


export default bootstrap;
