
import {isAbsolute, resolve} from 'path';
import {existsSync} from 'fs';
import {engine} from 'express-handlebars';
import helpers from './handlebar-helpers';
import themeParams from './theme-params';

import type {MashroomPortalThemePluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalThemePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {loggerFactory, serverConfig, serverInfo} = pluginContextHolder.getPluginContext();
    const { spaMode, darkMode, styleFile, showPortalAppHeaders, showEnvAndVersions } = pluginConfig;
    const logger = loggerFactory('mashroom.theme.default');

    let fixedStyleFile = styleFile;
    if (styleFile) {
        if (!isAbsolute(styleFile)) {
            fixedStyleFile = resolve(serverConfig.serverRootFolder, styleFile);
        }
        if (!existsSync(fixedStyleFile)) {
            logger.error(`Style file not found: ${fixedStyleFile}`);
            fixedStyleFile = null;
        }
    }

    themeParams.setParams({
        spaMode,
        darkMode,
        styleFile: fixedStyleFile,
        showPortalAppHeaders,
        showEnvAndVersions,
        mashroomVersion: serverInfo.version,
    });

    return {
        engineName: 'handlebars',
        engineFactory: () => {
            return engine({
                helpers,
                partialsDir: resolve(__dirname, '../views/partials/'),
                defaultLayout: '',
            });
        },
    };
};

export default bootstrap;
