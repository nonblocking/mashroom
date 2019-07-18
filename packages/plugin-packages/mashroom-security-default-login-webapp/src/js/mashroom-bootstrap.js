// @flow

import {resolve, isAbsolute} from 'path';
import {existsSync} from 'fs';
import webapp from './webapp';
import {setLoginFormTitle, setStyleFile, setIndexPage} from './context';

import type {MashroomWebAppPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const logger = pluginContext.loggerFactory('mashroom.login.webapp');

    let styleFile = resolve(__dirname, './style.css');
    if (pluginConfig.styleFile) {
        let externalStyleFile = null;
        if (isAbsolute(pluginConfig.styleFile)) {
            externalStyleFile = pluginConfig.styleFile;
        } else {
            externalStyleFile = resolve(pluginContext.serverConfig.serverRootFolder, pluginConfig.styleFile)
        }
        if (existsSync(externalStyleFile)) {
            styleFile = externalStyleFile;
        } else {
            logger.error(`Style file not found: ${externalStyleFile}`);
        }
    }
    setStyleFile(styleFile);

    const loginFormTitle = pluginConfig.loginFormTitle || pluginContext.serverConfig.name;
    setLoginFormTitle(loginFormTitle);

    setIndexPage(pluginContext.serverConfig.indexPage);
    return webapp;
};

export default bootstrap;
